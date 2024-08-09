use anyhow::Context;
use async_trait::async_trait;
use fpx_lib::data::models::Span;
use fpx_lib::data::{DbError, Result, Store, Transaction};
use libsql::{de, params, Builder, Connection, Rows};
use serde::de::DeserializeOwned;

mod migrations;

#[derive(Clone)]
pub struct LibsqlStore {
    connection: Connection,
}

impl LibsqlStore {
    pub async fn in_memory() -> Result<Self, anyhow::Error> {
        // Not sure if we need this database object, but for now we just drop
        // it.
        let database = Builder::new_local(":memory:")
            .build()
            .await
            .context("failed to build libSQL database object")?;

        let mut connection = database
            .connect()
            .context("failed to connect to libSQL database")?;

        Self::initialize_connection(&mut connection).await?;

        Ok(LibsqlStore { connection })
    }

    /// This function will execute a few PRAGMA statements to set the database
    /// connection. This should run before any other queries are executed.
    async fn initialize_connection(connection: &mut Connection) -> Result<()> {
        connection
            .query(
                "PRAGMA journal_mode = WAL;
                PRAGMA busy_timeout = 5000;
                PRAGMA cache_size = 2000;
                PRAGMA foreign_keys = ON;
                PRAGMA journal_size_limit = 27103364;
                PRAGMA mmap_size = 134217728;
                PRAGMA synchronous = NORMAL;
                PRAGMA temp_store = memory;",
                (),
            )
            .await
            .map_err(|err| DbError::InternalError(err.to_string()))?;

        Ok(())
    }
}

#[async_trait]
impl Store for LibsqlStore {
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

    async fn span_get(&self, _tx: &Transaction, trace_id: String, span_id: String) -> Result<Span> {
        let span = self
            .connection
            .query(
                "SELECT * FROM spans WHERE trace_id=$1 AND span_id=$2",
                (trace_id, span_id),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }

    async fn span_list_by_trace(&self, _tx: &Transaction, trace_id: String) -> Result<Vec<Span>> {
        let span = self
            .connection
            .query("SELECT * FROM spans WHERE trace_id=$1", params!(trace_id))
            .await?
            .fetch_all()
            .await?;

        Ok(span)
    }

    async fn span_create(&self, _tx: &Transaction, span: Span) -> Result<Span, DbError> {
        let span = self
            .connection
            .query(
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
                params!(
                    span.trace_id,
                    span.span_id,
                    span.parent_span_id,
                    span.name,
                    span.kind,
                    span.start_time,
                    span.end_time,
                    span.inner,
                ),
            )
            .await?
            .fetch_one()
            .await?;

        Ok(span)
    }
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
