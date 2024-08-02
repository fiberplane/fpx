use super::{models, DbError, Result, Store, Transaction};
use async_trait::async_trait;
use std::sync::{Arc, RwLock};
use tracing::info;

/// A simple in-memory [`Store`] implementation. Currently only intended for
/// proof of concept.
///
/// This implementation does not provide any Transaction support, nor will it
/// work concurrently.
#[derive(Clone, Default, Debug)]
pub struct FakeStore {
    /// Spans are stored in a [`RwLock`] so that we can always mutate the inner
    /// [`Vec`], even with a reference to this [`FakeStore`].
    spans: Arc<RwLock<Vec<models::Span>>>,
}

#[async_trait]
impl Store for FakeStore {
    async fn start_readonly_transaction(&self) -> Result<Transaction> {
        Ok(Transaction {})
    }
    async fn start_readwrite_transaction(&self) -> Result<Transaction> {
        Ok(Transaction {})
    }

    async fn commit_transaction(&self, _tx: Transaction) -> Result<(), DbError> {
        Ok(())
    }

    async fn rollback_transaction(&self, _tx: Transaction) -> Result<(), DbError> {
        Ok(())
    }

    async fn span_get(
        &self,
        _tx: &Transaction,
        trace_id: String,
        span_id: String,
    ) -> Result<models::Span> {
        let result = self
            .spans
            .read()
            .unwrap()
            .iter()
            .find(|span| span.trace_id == trace_id && span.span_id == span_id)
            .cloned()
            .ok_or(DbError::NotFound)?;

        Ok(result)
    }

    async fn span_list_by_trace(
        &self,
        _tx: &Transaction,
        trace_id: String,
    ) -> Result<Vec<models::Span>> {
        let result = self
            .spans
            .read()
            .unwrap()
            .iter()
            .filter(|span| span.trace_id == trace_id)
            .cloned()
            .collect();

        Ok(result)
    }

    async fn span_create(
        &self,
        _tx: &Transaction,
        span: models::Span,
    ) -> Result<models::Span, DbError> {
        let mut spans = self.spans.write().unwrap();

        spans.push(span.clone());

        Ok(span)
    }
}
