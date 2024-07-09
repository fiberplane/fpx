use crate::models::Request;
use anyhow::{Context, Result};
use libsql::{de, params, Builder, Connection, Rows};
use serde::de::DeserializeOwned;
use std::collections::BTreeMap;
use std::fmt::Display;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use thiserror::Error;
use tracing::error;

pub mod migrations;
mod models;
#[cfg(test)]
mod tests;

pub struct Transaction(libsql::Transaction);

impl Deref for Transaction {
    type Target = libsql::Transaction;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Store is a abstraction around data access.
///
/// It has a single connection open to the database (either file or in-memory).
/// The [`Connection`]'s implementation is already relying on a Arc, so we do
/// not have to do do anything there.
#[derive(Clone)]
pub struct Store {
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
            .with_context(|| format!("failed to build libSQL database object: {}", path))?;

        let connection = database
            .connect()
            .with_context(|| format!("failed to connect to libSQL database: {}", path))?;

        Ok(Store { connection })
    }

    pub async fn in_memory() -> Result<Self> {
        Self::open(DataPath::InMemory).await
    }

    pub async fn start_transaction(&self) -> Result<Transaction, DbError> {
        self.connection
            .transaction()
            .await
            .map(Transaction)
            .map_err(DbError::InternalError)
    }

    pub async fn commit_transaction(&self, tx: Transaction) -> Result<(), DbError> {
        tx.0.commit().await.map_err(DbError::InternalError)
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_create(
        tx: &Transaction,
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
    pub async fn request_list(_tx: &Transaction) -> Result<Vec<Request>> {
        todo!()
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_get(&self, tx: &Transaction, id: i64) -> Result<Request, DbError> {
        let request: models::Request = tx
            .query("SELECT * FROM requests WHERE id = ?", params!(id))
            .await?
            .fetch_one()
            .await?;

        Ok(request.into())
    }

    /// Create a new span in the database. This will return a new span with any
    /// fields potentially updated.
    pub async fn span_create(
        &self,
        tx: &Transaction,
        span: models::Span,
    ) -> Result<models::Span, DbError> {
        let span = tx
            .query(
                "INSERT INTO spans
                    (
                        trace_id,
                        span_id,
                        parent_trace_id,
                        name,
                        kind,
                        scope_name,
                        scope_version
                    )
                    VALUES
                        ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *",
                (
                    span.trace_id,
                    span.span_id,
                    span.parent_trace_id,
                    span.name,
                    span.kind.as_ref(),
                    span.scope_name,
                    span.scope_version,
                ),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }

    /// Retrieve a single span from the database.
    pub async fn span_get(
        &self,
        tx: &Transaction,
        trace_id: impl Into<TraceId>,
        span_id: impl Into<SpanId>,
    ) -> Result<models::Span, DbError> {
        let trace_id = trace_id.into();
        let span_id = span_id.into();

        let span = tx
            .query(
                "SELECT * FROM spans WHERE trace_id={} AND span_id={}",
                (trace_id, span_id),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }
}

type TraceId = String;
type SpanId = String;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("No rows were returned")]
    NotFound,

    #[error("failed to deserialize into `T`: {0}")]
    FailedDeserialize(#[from] serde::de::value::Error),

    #[error("Internal database error occurred: {0}")]
    InternalError(#[from] libsql::Error),
}

#[allow(dead_code)]
pub(crate) trait RowsExt {
    /// `T` must be a `struct`
    async fn fetch_one<T: DeserializeOwned>(&mut self) -> Result<T, DbError>;

    /// `T` must be a `struct`
    async fn fetch_optional<T: DeserializeOwned>(&mut self) -> Result<Option<T>, DbError>;

    /// `T` must be a `struct`
    async fn fetch_all<T: DeserializeOwned>(&mut self) -> Result<Vec<T>, DbError>;
}

impl RowsExt for Rows {
    async fn fetch_one<T: DeserializeOwned>(&mut self) -> Result<T, DbError> {
        self.fetch_optional().await?.ok_or(DbError::NotFound)
    }

    async fn fetch_optional<T: DeserializeOwned>(&mut self) -> Result<Option<T>, DbError> {
        error!("doing a fetch optional");
        match self.next().await? {
            Some(row) => Ok(Some(de::from_row(&row)?)),
            None => Ok(None),
        }
    }

    async fn fetch_all<T: DeserializeOwned>(&mut self) -> Result<Vec<T>, DbError> {
        let mut results = Vec::new();

        while let Some(row) = self.next().await? {
            results.push(de::from_row(&row)?);
        }

        Ok(results)
    }
}
