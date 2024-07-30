use async_trait::async_trait;
use std::sync::Arc;

mod models;
mod util;

type Result<T, E = DbError> = anyhow::Result<T, E>;

pub type BoxedStore = Arc<dyn Store>;

pub struct Transaction {}

pub enum DbError {}

#[async_trait]
pub trait Store: Send + Sync {
    async fn start_readonly_transaction(&self) -> Result<Transaction>;
    async fn span_get(tx: &Transaction, trace_id: String, span_id: String) -> Result<models::Span>;
}
