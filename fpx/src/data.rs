use crate::api::models::Request;
use anyhow::{Context, Result};
use libsql::{params, Builder, Connection};
use std::collections::BTreeMap;
use std::fmt::Display;
use std::marker::PhantomData;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::{Mutex, MutexGuard};
use tracing::instrument;
use util::RowsExt;

pub mod migrations;
pub mod models;
#[cfg(test)]
mod tests;
pub mod util;

pub struct Transaction<'a, T>
where
    T: TransactionType,
{
    tx: libsql::Transaction,
    guard: MutexGuard<'a, ()>,
    marker: PhantomData<T>,
}

impl<'a, T> Transaction<'a, T>
where
    T: TransactionType,
{
    pub fn new(tx: libsql::Transaction, guard: MutexGuard<'a, ()>) -> Self {
        Self {
            tx,
            guard,
            marker: PhantomData,
        }
    }
}

impl<'a, T> Deref for Transaction<'a, T>
where
    T: TransactionType,
{
    type Target = libsql::Transaction;

    fn deref(&self) -> &Self::Target {
        &self.tx
    }
}

pub trait TransactionType {}
pub trait ReadTransaction: TransactionType {}
pub trait WriteTransaction: TransactionType {}

pub struct ReadOnly;
impl TransactionType for ReadOnly {}
impl ReadTransaction for ReadOnly {}

pub struct ReadWrite;
impl TransactionType for ReadWrite {}
impl ReadTransaction for ReadWrite {}
impl WriteTransaction for ReadWrite {}

#[derive(Debug, Error)]
pub enum DbError {
    #[error("No rows were returned")]
    NotFound,

    #[error("failed to deserialize into `T`: {0}")]
    FailedDeserialize(#[from] serde::de::value::Error),

    #[error("Internal database error occurred: {0}")]
    InternalError(#[from] libsql::Error),
}

/// Store is a abstraction around data access.
///
/// It has a single connection open to the database (either file or in-memory).
/// The [`Connection`]'s implementation is already relying on a Arc, so we do
/// not have to do do anything there.
#[derive(Clone)]
pub struct Store {
    lock: Arc<Mutex<()>>,
    connection: Connection,
}

pub enum DataPath {
    InMemory,
    File(PathBuf),
}

impl DataPath {
    pub fn as_path(&self) -> &Path {
        match self {
            DataPath::InMemory => Path::new(":memory:"),
            DataPath::File(path) => path.as_path(),
        }
    }
}

impl Display for DataPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataPath::InMemory => write!(f, ":memory:"),
            DataPath::File(path) => write!(f, "{}", path.display()),
        }
    }
}

impl Store {
    /// Open a new store with the specified path
    pub async fn open(path: DataPath) -> Result<Self> {
        // Not sure if we need this database object, but for now we just drop
        // it.
        let database = Builder::new_local(path.as_path())
            .build()
            .await
            .with_context(|| {
                format!(
                    "failed to build libSQL database object: {:?}",
                    path.as_path()
                )
            })?;

        let mut connection = database.connect().with_context(|| {
            format!("failed to connect to libSQL database: {:?}", path.as_path())
        })?;

        Self::initialize_connection(&mut connection)
            .await
            .context("failed to initialize connection")?;

        Ok(Store {
            lock: Arc::new(Mutex::new(())),
            connection,
        })
    }

    pub async fn in_memory() -> Result<Self> {
        Self::open(DataPath::InMemory).await
    }

    /// This function will execute a few PRAGMA statements to set the database
    /// connection. This should run before any other queries are executed.
    async fn initialize_connection(connection: &mut Connection) -> Result<(), DbError> {
        connection
            .query(
                "PRAGMA journal_mode = WAL;
                PRAGMA busy_timeout = 5000;
                PRAGMA cache_size = 2000;
                PRAGMA foreign_keys = ON;
                PRAGMA journal_size_limit = 27103364;
                PRAGMA mmap_size = 134217728;
                PRAGMA synchronous = NORMAL;
                PRAGMA temp_store = memory;",
                (),
            )
            .await
            .map_err(DbError::InternalError)?;

        Ok(())
    }

    /// Start a transaction that will only do queries.
    ///
    /// NOTE: Currently this creates a global lock on the entire database until
    /// the transaction is committed or rolled back. So make sure that the
    /// transaction is open as short as possible.
    pub async fn start_readonly_transaction(&self) -> Result<Transaction<ReadOnly>, DbError> {
        let guard = self.lock.lock().await;

        let tx = self
            .connection
            .transaction()
            .await
            .map_err(DbError::InternalError)?;

        Ok(Transaction::new(tx, guard))
    }

    /// Start a transaction that might do a write operation, such as a INSERT,
    /// UPDATE or DELETE.
    ///
    /// NOTE: Currently this creates a global lock on the entire database until
    /// the transaction is committed or rolled back. So make sure that the
    /// transaction is open as short as possible.
    pub async fn start_readwrite_transaction(&self) -> Result<Transaction<ReadWrite>, DbError> {
        let guard = self.lock.lock().await;

        let tx = self
            .connection
            .transaction()
            .await
            .map_err(DbError::InternalError)?;

        Ok(Transaction::new(tx, guard))
    }

    /// Commit a transaction and release the global lock.
    pub async fn commit_transaction<T>(&self, tx: Transaction<'_, T>) -> Result<(), DbError>
    where
        T: TransactionType,
    {
        let result = tx.tx.commit().await.map_err(DbError::InternalError);

        drop(tx.guard);

        result
    }

    /// Rollback a transaction and release the global lock.
    pub async fn rollback_transaction<T>(&self, tx: Transaction<'_, T>) -> Result<(), DbError>
    where
        T: TransactionType,
    {
        let result = tx.tx.rollback().await.map_err(DbError::InternalError);

        drop(tx.guard);

        result
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_create<T: WriteTransaction>(
        tx: &Transaction<'_, T>,
        method: &str,
        url: &str,
        body: &str,
        headers: BTreeMap<String, String>,
    ) -> Result<u32> {
        let headers = serde_json::to_string(&headers)?;

        let request: models::Request = tx
            .query(
                "INSERT INTO requests (method, url, body, headers) VALUES (?, ?, ?, ?) RETURNING *",
                (method, url, body, headers),
            )
            .await
            .context("Unable to create request")?
            .fetch_one()
            .await?;

        Ok(request.id)
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_get<T: ReadTransaction>(
        &self,
        tx: &Transaction<'_, T>,
        id: i64,
    ) -> Result<Request, DbError> {
        let request: models::Request = tx
            .query("SELECT * FROM requests WHERE id = ?", params!(id))
            .await?
            .fetch_one()
            .await?;

        Ok(request.into())
    }

    /// Create a new span in the database. This will return a new span with any
    /// fields potentially updated.
    #[instrument(err, skip_all)]
    pub async fn span_create<T: WriteTransaction>(
        &self,
        tx: &Transaction<'_, T>,
        span: models::Span,
    ) -> Result<models::Span, DbError> {
        let span = tx
            .query(
                "INSERT INTO spans
                    (
                        trace_id,
                        span_id,
                        parent_span_id,
                        name,
                        kind,
                        start_time,
                        end_time,
                        inner
                    )
                    VALUES
                        ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *",
                params!(
                    span.trace_id,
                    span.span_id,
                    span.parent_span_id,
                    span.name,
                    span.kind,
                    span.start_time,
                    span.end_time,
                    span.inner,
                ),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }

    /// Retrieve a single span from the database.
    #[instrument(err, skip_all, fields(trace_id = ?trace_id.as_ref(), span_id = ?span_id.as_ref()))]
    pub async fn span_get<T: ReadTransaction>(
        &self,
        tx: &Transaction<'_, T>,
        trace_id: impl AsRef<str>,
        span_id: impl AsRef<str>,
    ) -> Result<models::Span, DbError> {
        let span = tx
            .query(
                "SELECT * FROM spans WHERE trace_id=$1 AND span_id=$2",
                (trace_id.as_ref(), span_id.as_ref()),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }

    /// Retrieve all spans for a single trace from the database.
    #[instrument(err, skip(self, tx))]
    pub async fn span_list_by_trace<T: ReadTransaction>(
        &self,
        tx: &Transaction<'_, T>,
        trace_id: String,
    ) -> Result<Vec<models::Span>, DbError> {
        let span = tx
            .query("SELECT * FROM spans WHERE trace_id=$1", params!(trace_id))
            .await?
            .fetch_all()
            .await?;

        Ok(span)
    }
}
