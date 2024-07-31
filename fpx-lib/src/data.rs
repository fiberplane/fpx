use async_trait::async_trait;
use std::sync::Arc;
use thiserror::Error;

mod models;
mod util;

type Result<T, E = DbError> = anyhow::Result<T, E>;

pub type BoxedStore = Arc<dyn Store>;

pub struct Transaction {}

#[derive(Debug, Error)]
pub enum DbError {
    #[error("No rows were returned")]
    NotFound,

    #[error("failed to deserialize into `T`: {0}")]
    FailedDeserialize(#[from] serde::de::value::Error),
}

#[async_trait]
pub trait Store: Send + Sync {
    async fn start_readonly_transaction(&self) -> Result<Transaction>;

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
}
