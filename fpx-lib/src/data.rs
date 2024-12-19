use crate::data::models::HexEncodedId;
use crate::events::ServerEvents;
use async_trait::async_trait;
use std::sync::Arc;
use thiserror::Error;
use util::Timestamp;

pub mod models;
pub mod sql;
pub mod util;

pub type Result<T, E = DbError> = anyhow::Result<T, E>;

pub type BoxedEvents = Arc<dyn ServerEvents>;
pub type BoxedStore = Arc<dyn Store>;

#[derive(Clone, Default, Debug)]
pub struct Transaction {}

impl Transaction {
    pub fn new() -> Self {
        Self {}
    }
}

#[derive(Debug, Error)]
pub enum DbError {
    #[error("No rows were returned")]
    NotFound,

    #[error("failed to deserialize into `T`: {0}")]
    FailedDeserialize(#[from] serde::de::value::Error),

    #[error("Internal error: {0}")]
    InternalError(String),

    #[cfg(feature = "libsql")]
    #[error("Internal database error occurred: {0}")]
    LibsqlError(#[from] libsql::Error),
}

#[async_trait]
pub trait Store: Send + Sync {
    async fn start_readonly_transaction(&self) -> Result<Transaction>;
    async fn start_readwrite_transaction(&self) -> Result<Transaction>;

    async fn commit_transaction(&self, tx: Transaction) -> Result<(), DbError>;
    async fn rollback_transaction(&self, tx: Transaction) -> Result<(), DbError>;

    async fn span_get(
        &self,
        tx: &Transaction,
        trace_id: &HexEncodedId,
        span_id: &HexEncodedId,
    ) -> Result<models::Span>;

    async fn span_list_by_trace(
        &self,
        tx: &Transaction,
        trace_id: &HexEncodedId,
    ) -> Result<Vec<models::Span>>;

    async fn span_create(&self, tx: &Transaction, span: models::Span) -> Result<models::Span>;

    /// Get a list of all the traces.
    ///
    /// Note that a trace is a computed value, so not all properties are
    /// present. To get all the data, use the [`Self::span_list_by_trace`] fn.
    async fn traces_list(
        &self,
        tx: &Transaction,
        // Future improvement could hold sort fields, limits, etc
    ) -> Result<Vec<models::Trace>>;

    /// Delete all spans with a specific trace_id.
    async fn span_delete_by_trace(
        &self,
        tx: &Transaction,
        trace_id: &HexEncodedId,
    ) -> Result<Option<u64>>;

    /// Delete a single span.
    async fn span_delete(
        &self,
        tx: &Transaction,
        trace_id: &HexEncodedId,
        span_id: &HexEncodedId,
    ) -> Result<Option<u64>>;

    async fn insights_list_all(
        &self,
        _tx: &Transaction,
        newer_then: Timestamp,
    ) -> Result<Vec<models::Span>>;
}
