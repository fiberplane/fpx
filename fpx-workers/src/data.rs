use std::collections::HashMap;
use axum::async_trait;
use fpx::data::models::HexEncodedId;
use fpx::data::sql::SqlBuilder;
use fpx::data::{models, DbError, Result, Store, Transaction};
use serde::Deserialize;
use std::sync::Arc;
use wasm_bindgen::JsValue;
use worker::send::SendFuture;
use worker::{D1Database, D1ResultMeta};
use fpx::api::models::settings::Settings;

pub struct D1Store {
    database: Arc<D1Database>,
    sql_builder: SqlBuilder,
}

impl D1Store {
    pub fn new(database: D1Database) -> Self {
        D1Store {
            database: Arc::new(database),
            sql_builder: SqlBuilder::new(),
        }
    }

    async fn fetch_one<T>(&self, query: impl Into<String>, values: &[JsValue]) -> Result<T>
    where
        T: for<'a> Deserialize<'a>,
    {
        let prepared_statement = self
            .database
            .prepare(query)
            .bind(values)
            .map_err(|err| DbError::InternalError(err.to_string()))?; // TODO: Correct error;

        let result = prepared_statement
            .first(None)
            .await
            .map_err(|err| DbError::InternalError(err.to_string()))? // TODO: Correct error;
            .ok_or(DbError::NotFound)?;

        Ok(result)
    }

    async fn fetch_all<T>(&self, query: impl Into<String>, values: &[JsValue]) -> Result<Vec<T>>
    where
        T: for<'a> Deserialize<'a>,
    {
        let prepared_statement = self
            .database
            .prepare(query)
            .bind(values)
            .map_err(|err| DbError::InternalError(err.to_string()))?; // TODO: Correct error;

        let result = prepared_statement
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
        trace_id: &HexEncodedId,
        span_id: &HexEncodedId,
    ) -> Result<models::Span> {
        SendFuture::new(async {
            self.fetch_one(
                self.sql_builder.span_get(),
                &[trace_id.into(), span_id.into()],
            )
            .await
        })
        .await
    }

    async fn span_list_by_trace(
        &self,
        _tx: &Transaction,
        trace_id: &HexEncodedId,
    ) -> Result<Vec<models::Span>> {
        SendFuture::new(async {
            self.fetch_all(self.sql_builder.span_list_by_trace(), &[trace_id.into()])
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
            let parent_span = match span.parent_span_id {
                Some(val) => val.into_inner().into(),
                None => JsValue::null(),
            };

            self.fetch_one(
                self.sql_builder.span_create(),
                &[
                    span.trace_id.into(),
                    span.span_id.into(),
                    parent_span,
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
    ) -> Result<Vec<models::Trace>> {
        SendFuture::new(async {
            let traces = self
                .fetch_all(self.sql_builder.traces_list(None), &[])
                .await?;

            Ok(traces)
        })
        .await
    }

    /// Delete all spans with a specific trace_id.
    async fn span_delete_by_trace(
        &self,
        _tx: &Transaction,
        trace_id: &HexEncodedId,
    ) -> Result<Option<u64>> {
        SendFuture::new(async {
            let prepared_statement = self
                .database
                .prepare(self.sql_builder.span_delete_by_trace())
                .bind(&[trace_id.into()])
                .map_err(|err| DbError::InternalError(err.to_string()))?;

            let results = prepared_statement
                .run()
                .await
                .map_err(|err| DbError::InternalError(err.to_string()))?;

            if let Ok(Some(D1ResultMeta {
                rows_written: Some(rows_written),
                ..
            })) = results.meta()
            {
                Ok(Some(rows_written as u64))
            } else {
                Ok(None)
            }
        })
        .await
    }

    /// Delete a single span.
    async fn span_delete(
        &self,
        _tx: &Transaction,
        trace_id: &HexEncodedId,
        span_id: &HexEncodedId,
    ) -> Result<Option<u64>> {
        SendFuture::new(async {
            let prepared_statement = self
                .database
                .prepare(self.sql_builder.span_delete())
                .bind(&[trace_id.into(), span_id.into()])
                .map_err(|err| DbError::InternalError(err.to_string()))?;

            let results = prepared_statement
                .run()
                .await
                .map_err(|err| DbError::InternalError(err.to_string()))?;

            if let Ok(Some(D1ResultMeta {
                rows_written: Some(rows_written),
                ..
            })) = results.meta()
            {
                Ok(Some(rows_written as u64))
            } else {
                Ok(None)
            }
        })
        .await
    }

    async fn settings_upsert(&self, tx: &Transaction, settings: Settings) -> Result<Settings> {
        todo!()
    }

    async fn settings_get(&self, tx: &Transaction) -> Result<Settings> {
        todo!()
    }
}
