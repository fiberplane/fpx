use async_trait::async_trait;
use std::sync::Arc;
use thiserror::Error;

pub mod fake_store;
pub mod models;
mod util;

pub type Result<T, E = DbError> = anyhow::Result<T, E>;

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
        trace_id: String,
        span_id: String,
    ) -> Result<models::Span>;

    async fn span_list_by_trace(
        &self,
        tx: &Transaction,
        trace_id: String,
    ) -> Result<Vec<models::Span>>;

    async fn span_create(
        &self,
        tx: &Transaction,
        span: models::Span,
    ) -> Result<models::Span, DbError>;
}
