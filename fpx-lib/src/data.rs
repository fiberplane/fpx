use async_trait::async_trait;
use libsql::de;
use serde::de::DeserializeOwned;
use serde::Deserialize;
use std::sync::Arc;
use thiserror::Error;

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
    type ValueTypes;

    async fn start_readonly_transaction(&self) -> Result<Transaction>;
    async fn start_readwrite_transaction(&self) -> Result<Transaction>;

    async fn commit_transaction(&self, tx: Transaction) -> Result<()>;
    async fn rollback_transaction(&self, tx: Transaction) -> Result<()>;

    async fn fetch_one<T>(
        &self,
        tx: &Transaction,
        query: impl Into<String>,
        values: &[Self::ValueTypes],
    ) -> Result<T>
    where
        T: for<'a> Deserialize<'a>;

    async fn fetch_all<T>(
        &self,
        tx: &Transaction,
        query: impl Into<String>,
        values: &[Self::ValueTypes],
    ) -> Result<Vec<T>>
    where
        T: for<'a> Deserialize<'a>;

    async fn fetch_optional<T>(
        &self,
        tx: &Transaction,
        query: impl Into<String>,
        values: &[Self::ValueTypes],
    ) -> Result<Option<T>, DbError>
    where
        T: for<'a> Deserialize<'a>;

    async fn span_get(
        &self,
        tx: &Transaction,
        trace_id: String,
        span_id: String,
    ) -> Result<models::Span> {
        self.fetch_one(
            tx,
            "SELECT * FROM spans WHERE trace_id = $1 AND span_id = $2",
            &[trace_id.into(), span_id.into()],
        )
        .await
    }

    async fn span_list_by_trace(
        &self,
        tx: &Transaction,
        trace_id: String,
    ) -> Result<Vec<models::Span>> {
        self.fetch_all(
            tx,
            "SELECT * FROM spans WHERE trace_id=$1",
            &[trace_id.into()],
        )
        .await
    }

    async fn span_create(
        &self,
        tx: &Transaction,
        span: models::Span,
    ) -> Result<models::Span, DbError> {
        self.fetch_one(
            tx,
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
            &[
                span.trace_id.into(),
                span.span_id.into(),
                span.parent_span_id.unwrap_or_default().into(),
                span.name.into(),
                span.kind.into(),
                span.start_time.into(),
                span.end_time.into(),
                span.inner.into(),
            ],
        )
        .await
    }
}
