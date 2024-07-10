use crate::models::Request;
use anyhow::{Context, Result};
use libsql::{de, params, Builder, Connection, Rows};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer};
use std::collections::BTreeMap;
use std::fmt::Display;
use std::ops::{Deref, DerefMut};
use std::path::{Path, PathBuf};
use thiserror::Error;
use tracing::error;

pub mod migrations;
pub mod models;
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
                        parent_span_id,
                        name,
                        kind,
                        scope_name,
                        scope_version,
                        start_time,
                        end_time
                    )
                    VALUES
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *",
                (
                    span.trace_id,
                    span.span_id,
                    span.parent_span_id,
                    span.name,
                    span.kind.as_ref(),
                    span.scope_name,
                    span.scope_version,
                    span.start_time.unix_nanos(),
                    span.end_time.unix_nanos(),
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
pub struct Json<T: DeserializeOwned>(T);

impl<T: DeserializeOwned> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: DeserializeOwned> DerefMut for Json<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: DeserializeOwned> AsRef<T> for Json<T> {
    fn as_ref(&self) -> &T {
        &self.0
    }
}

impl<T: DeserializeOwned> AsMut<T> for Json<T> {
    fn as_mut(&mut self) -> &mut T {
        &mut self.0
    }
}

impl<'de, T: DeserializeOwned> Deserialize<'de> for Json<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string: String = Deserialize::deserialize(deserializer)?;
        let json: T = serde_json::from_str(&string).map_err(serde::de::Error::custom)?;

        Ok(Json(json))
    }
}

pub struct Timestamp(u64);

impl Timestamp {
    pub fn unix_nanos(&self) -> u64 {
        self.0
    }

    pub fn now() -> Self {
        Self(time::OffsetDateTime::now_utc().unix_timestamp_nanos() as u64)
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

impl<'de> Deserialize<'de> for Timestamp {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let timestamp: i64 = Deserialize::deserialize(deserializer)?;

        Ok(Timestamp(timestamp as u64))
    }
}
