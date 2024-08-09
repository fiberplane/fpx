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
}

#[async_trait]
impl Store for D1Store {
    type ValueTypes = JsValue;

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

    async fn fetch_one<T>(
        &self,
        tx: &Transaction,
        query: impl Into<String>,
        values: &[Self::ValueTypes],
    ) -> Result<T>
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

    async fn fetch_all<T>(
        &self,
        tx: &Transaction,
        query: impl Into<String>,
        values: &[Self::ValueTypes],
    ) -> Result<Vec<T>>
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

    async fn fetch_optional<T>(
        &self,
        tx: &Transaction,
        query: impl Into<String>,
        values: &[Self::ValueTypes],
    ) -> Result<Option<T>, DbError>
    where
        T: for<'a> Deserialize<'a>,
    {
        todo!()
    }
}
