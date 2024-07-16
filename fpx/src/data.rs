use crate::api::models::Request;
use anyhow::{Context, Result};
use libsql::{de, params, Builder, Connection, Rows};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::BTreeMap;
use std::fmt::Display;
use std::ops::{Deref, DerefMut};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::{Mutex, MutexGuard};
use tracing::{error, instrument};

pub mod migrations;
pub mod models;
#[cfg(test)]
mod tests;

pub struct Transaction<'a> {
    tx: libsql::Transaction,
    guard: MutexGuard<'a, ()>,
}

impl<'a> Transaction<'a> {
    pub fn new(tx: libsql::Transaction, guard: MutexGuard<'a, ()>) -> Self {
        Self { tx, guard }
    }
}

impl<'a> Deref for Transaction<'a> {
    type Target = libsql::Transaction;

    fn deref(&self) -> &Self::Target {
        &self.tx
    }
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
            .with_context(|| format!("failed to build libSQL database object: {}", path))?;

        let connection = database
            .connect()
            .with_context(|| format!("failed to connect to libSQL database: {}", path))?;

        Ok(Store {
            connection,
            lock: Arc::new(Mutex::new(())),
        })
    }

    pub async fn in_memory() -> Result<Self> {
        Self::open(DataPath::InMemory).await
    }

    pub async fn start_transaction(&self) -> Result<Transaction, DbError> {
        let guard = self.lock.lock().await;

        let tx = self
            .connection
            .transaction()
            .await
            .map_err(DbError::InternalError)?;

        Ok(Transaction::new(tx, guard))
    }

    pub async fn commit_transaction(&self, tx: Transaction<'_>) -> Result<(), DbError> {
        let result = tx.tx.commit().await.map_err(DbError::InternalError);

        drop(tx.guard);

        result
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_create(
        tx: &Transaction<'_>,
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
    pub async fn request_list(_tx: &Transaction<'_>) -> Result<Vec<Request>> {
        todo!()
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_get(&self, tx: &Transaction<'_>, id: i64) -> Result<Request, DbError> {
        let request: models::Request = tx
            .query("SELECT * FROM requests WHERE id = ?", params!(id))
            .await?
            .fetch_one()
            .await?;

        Ok(request.into())
    }

    /// Create a new span in the database. This will return a new span with any
    /// fields potentially updated.
    #[instrument(skip(self, tx, span))]
    pub async fn span_create(
        &self,
        tx: &Transaction<'_>,
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
                        state,
                        flags,
                        kind,
                        scope_name,
                        scope_version,
                        start_time,
                        end_time,
                        attributes,
                        resource_attributes,
                        scope_attributes,
                        status,
                        events,
                        links
                    )
                    VALUES
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    RETURNING *",
                params!(
                    span.trace_id,
                    span.span_id,
                    span.parent_span_id,
                    span.name,
                    span.state,
                    span.flags,
                    span.kind.as_ref(),
                    span.scope_name,
                    span.scope_version,
                    span.start_time,
                    span.end_time,
                    span.attributes,
                    span.resource_attributes,
                    span.scope_attributes,
                    span.status,
                    span.events,
                    span.links,
                ),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }

    /// Retrieve a single span from the database.
    #[instrument(skip(self, tx))]
    pub async fn span_get(
        &self,
        tx: &Transaction<'_>,
        trace_id: Vec<u8>,
        span_id: Vec<u8>,
    ) -> Result<models::Span, DbError> {
        let span = tx
            .query(
                "SELECT * FROM spans WHERE trace_id=$1 AND span_id=$2",
                (trace_id, span_id),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }

    /// Retrieve all spans for a single trace from the database.
    #[instrument(skip(self, tx))]
    pub async fn span_list_by_trace(
        &self,
        tx: &Transaction<'_>,
        trace_id: Vec<u8>,
    ) -> Result<Vec<models::Span>, DbError> {
        let span = tx
            .query("SELECT * FROM spans WHERE trace_id=$1", params!(trace_id))
            .await?
            .fetch_all()
            .await?;

        Ok(span)
    }
}

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

#[derive(Debug)]
pub struct Json<T>(T);

impl<T> Json<T> {
    pub fn into_inner(self) -> T {
        self.0
    }
}

impl<T> From<Json<T>> for libsql::Value
where
    T: Serialize,
{
    fn from(value: Json<T>) -> Self {
        let value = serde_json::to_string(&value.0).expect("failed to serialize Json<T>");
        libsql::Value::Text(value)
    }
}

impl<T> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for Json<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T> AsRef<T> for Json<T> {
    fn as_ref(&self) -> &T {
        &self.0
    }
}

impl<T> AsMut<T> for Json<T> {
    fn as_mut(&mut self) -> &mut T {
        &mut self.0
    }
}

impl<T> Default for Json<T>
where
    T: Default,
{
    fn default() -> Self {
        Self(T::default())
    }
}

impl<'de, T> Deserialize<'de> for Json<T>
where
    T: DeserializeOwned,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string: String = Deserialize::deserialize(deserializer)?;
        let json: T = serde_json::from_str(&string).map_err(serde::de::Error::custom)?;

        Ok(Json(json))
    }
}

#[derive(Default)]
pub struct Timestamp(u64);

impl Timestamp {
    pub fn unix_nanos(&self) -> u64 {
        self.0
    }

    pub fn now() -> Self {
        Self(time::OffsetDateTime::now_utc().unix_timestamp_nanos() as u64)
    }
}

impl From<Timestamp> for libsql::Value {
    fn from(timestamp: Timestamp) -> Self {
        libsql::Value::Integer(timestamp.0 as i64)
    }
}

impl From<Timestamp> for time::OffsetDateTime {
    fn from(timestamp: Timestamp) -> Self {
        // NOTE: this should not happen any time soon, so we should be able to
        //       get away with this for now.
        time::OffsetDateTime::from_unix_timestamp_nanos(timestamp.unix_nanos() as i128)
            .expect("timestamp is too large for OffsetDateTime")
    }
}

impl Deref for Timestamp {
    type Target = u64;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Timestamp {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl AsRef<u64> for Timestamp {
    fn as_ref(&self) -> &u64 {
        &self.0
    }
}

impl AsMut<u64> for Timestamp {
    fn as_mut(&mut self) -> &mut u64 {
        &mut self.0
    }
}

impl Serialize for Timestamp {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_i64(self.0 as i64)
    }
}

impl<'de> Deserialize<'de> for Timestamp {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let timestamp: i64 = Deserialize::deserialize(deserializer)?;

        Ok(Timestamp(timestamp as u64))
    }
}
