use axum::async_trait;
use fpx_lib::data::{models, DbError, Result, Store, Transaction};
use serde::Deserialize;
use std::sync::Arc;
use wasm_bindgen::JsValue;
use worker::send::SendFuture;
use worker::D1Database;

pub struct D1Store {
    database: Arc<D1Database>,
}

impl D1Store {
    pub fn new(database: D1Database) -> Self {
        D1Store {
            database: Arc::new(database),
        }
    }

    async fn fetch_one<T>(&self, query: impl Into<String>, values: &[JsValue]) -> Result<T>
    where
        T: for<'a> Deserialize<'a>,
    {
        let prepared_statement = self.database.prepare(query);

        let result = prepared_statement
            .bind(values)
            .map_err(|err| DbError::InternalError(err.to_string()))?; // TODO: Correct error

        let result = result
            .first(None)
            .await
            .map_err(|err| DbError::InternalError(err.to_string()))?
            .ok_or(DbError::NotFound)?; // TODO: Correct error

        Ok(result)
    }

    async fn fetch_all<T>(&self, query: impl Into<String>, values: &[JsValue]) -> Result<Vec<T>>
    where
        T: for<'a> Deserialize<'a>,
    {
        let prepared_statement = self.database.prepare(query);

        let result = prepared_statement
            .bind(values)
            .map_err(|err| DbError::InternalError(err.to_string()))?; // TODO: Correct error

        let result = result
            .all()
            .await
            .map_err(|err| DbError::InternalError(err.to_string()))? // TODO: Correct error
            .results()
            .map_err(|err| DbError::InternalError(err.to_string()))?; // TODO: Correct error

        Ok(result)
    }
}

#[async_trait]
impl Store for D1Store {
    async fn start_readonly_transaction(&self) -> Result<Transaction> {
        // Let's fake this for now
        Ok(Transaction::default())
    }
    async fn start_readwrite_transaction(&self) -> Result<Transaction> {
        // Let's fake this for now
        Ok(Transaction::default())
    }

    async fn commit_transaction(&self, _tx: Transaction) -> Result<(), DbError> {
        // Let's fake this for now
        Ok(())
    }
    async fn rollback_transaction(&self, _tx: Transaction) -> Result<(), DbError> {
        // Let's fake this for now
        Ok(())
    }

    async fn span_get(
        &self,
        _tx: &Transaction,
        trace_id: String,
        span_id: String,
    ) -> Result<models::Span> {
        SendFuture::new(async {
            self.fetch_one(
                "SELECT * FROM spans WHERE trace_id=$1 AND span_id=$2",
                &[trace_id.into(), span_id.into()],
            )
            .await
        })
        .await
    }

    async fn span_list_by_trace(
        &self,
        _tx: &Transaction,
        trace_id: &str,
    ) -> Result<Vec<models::Span>> {
        SendFuture::new(async {
            self.fetch_all("SELECT * FROM spans WHERE trace_id=$1", &[trace_id.into()])
                .await
        })
        .await
    }

    async fn span_create(
        &self,
        _tx: &Transaction,
        span: models::Span,
    ) -> Result<models::Span, DbError> {
        SendFuture::new(async {
            self.fetch_one(
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
        })
        .await
    }

    /// Get a list of all the traces. (currently limited to 20, sorted by most
    /// recent [`end_time`])
    ///
    /// Note that a trace is a computed value, so not all properties are
    /// present. To get all the data, use the [`Self::span_list_by_trace`] fn.
    async fn traces_list(
        &self,
        _tx: &Transaction,
        // Future improvement could hold sort fields, limits, etc
    ) -> Result<Vec<fpx_lib::data::models::Trace>> {
        SendFuture::new(async {
            let traces = self
                .fetch_all(
                    "
                    SELECT trace_id, MAX(end_time) as end_time
                    FROM spans
                    GROUP BY trace_id
                    ORDER BY end_time DESC
                    LIMIT 20
                    ",
                    &[],
                )
                .await?;

            Ok(traces)
        })
        .await
    }
}
