use crate::api::types::Request;
use anyhow::{Context, Result};
use libsql::{de, params, Builder, Connection, Rows, Transaction};
use models::DbRequest;
use serde::de::DeserializeOwned;
use std::collections::BTreeMap;
use std::fmt::Display;
use std::path::{Path, PathBuf};
use thiserror::Error;

pub mod migrations;
mod models;

/// Store is a abstraction around data access.
///
/// It has a single connection open to the database (either file or in-memory).
/// The [`Connection`]'s implementation is already relying on a Arc, so we do
/// not have to do do anything there.
#[derive(Clone)]
pub struct Store {
    connection: Connection,
}

pub enum DataPath {
    InMemory,
    File(PathBuf),
}

impl DataPath {
    pub fn as_path(&self) -> &Path {
        match self {
            DataPath::InMemory => Path::new(":memory:"),
            DataPath::File(path) => path.as_path(),
        }
    }
}

impl Display for DataPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataPath::InMemory => write!(f, ":memory:"),
            DataPath::File(path) => write!(f, "{}", path.display()),
        }
    }
}

impl Store {
    /// Open a new store with the specified path
    pub async fn open(path: DataPath) -> Result<Self> {
        // Not sure if we need this database object, but for now we just drop
        // it.
        let database = Builder::new_local(path.as_path())
            .build()
            .await
            .with_context(|| format!("failed to build libSQL database object: {}", path))?;

        let connection = database
            .connect()
            .with_context(|| format!("failed to connect to libSQL database: {}", path))?;

        Ok(Store { connection })
    }

    pub async fn in_memory() -> Result<Self> {
        Self::open(DataPath::InMemory).await
    }

    pub async fn start_transaction(&self) -> Result<Transaction, DbError> {
        self.connection
            .transaction()
            .await
            .map_err(DbError::InternalError)
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_create(
        tx: &Transaction,
        method: &str,
        url: &str,
        body: &str,
        headers: BTreeMap<String, String>,
    ) -> Result<i64> {
        let headers = serde_json::to_string(&headers)?;

        let request: DbRequest = tx
            .query(
                "INSERT INTO requests (method, url, body, headers) VALUES (?, ?, ?, ?) RETURNING *",
                (method, url, body, headers),
            )
            .await
            .context("Unable to create request")?
            .fetch_one()
            .await?;

        Ok(request.id)
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_list(_tx: &Transaction) -> Result<Vec<Request>> {
        todo!()
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_get(&self, tx: &Transaction, id: i64) -> Result<Request, DbError> {
        let request: DbRequest = tx
            .query("SELECT * FROM requests WHERE id = ?", params!(id))
            .await?
            .fetch_one()
            .await?;

        Ok(request.into())
    }
}

#[derive(Debug, Error)]
pub enum DbError {
    #[error("No rows were returned")]
    NotFound,

    #[error("failed to deserialize into `T`: {message}")]
    FailedDeserialize { message: String },

    #[error("Unable to deserialize JSON: {0}")]
    InvalidJson(#[from] serde_json::Error),

    #[error("Internal database error occurred: {0}")]
    InternalError(#[from] libsql::Error),
}

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
            Some(row) => Ok(Some(de::from_row(&row).map_err(|err| {
                DbError::FailedDeserialize {
                    message: err.to_string(),
                }
            })?)),
            None => Ok(None),
        }
    }

    async fn fetch_all<T: DeserializeOwned>(&mut self) -> Result<Vec<T>, DbError> {
        let mut results = Vec::new();

        while let Some(row) = self.next().await? {
            results.push(
                de::from_row(&row).map_err(|err| DbError::FailedDeserialize {
                    message: err.to_string(),
                })?,
            );
        }

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use crate::data::models::Json;
    use crate::data::{RowsExt, Store};
    use libsql::params;
    use serde::Deserialize;
    use std::collections::BTreeMap;

    #[tokio::test]
    async fn test_extensions() {
        let store = Store::in_memory().await.unwrap();

        {
            let tx = store.start_transaction().await.unwrap();

            #[derive(Deserialize)]
            struct Test {
                test: i32,
            }

            let fone: Test = tx
                .query("select 1 as test", ())
                .await
                .unwrap()
                .fetch_one()
                .await
                .unwrap();

            assert_eq!(fone.test, 1);

            // create a temporary table and immediately drop it. this returns 0 rows without using existing tables
            let fopt: Option<Test> = tx
                .query(
                    "create temporary table temp_table (id integer); drop table temp_table",
                    (),
                )
                .await
                .unwrap()
                .fetch_optional()
                .await
                .unwrap();

            assert!(fopt.is_none());

            let fall: Vec<Test> = tx
                .query("select 1 as test union all select 2 union all select 3", ())
                .await
                .unwrap()
                .fetch_all()
                .await
                .unwrap();

            assert_eq!(fall.len(), 3);
            assert_eq!(fall[0].test, 1);
            assert_eq!(fall[1].test, 2);
            assert_eq!(fall[2].test, 3);

            #[derive(Deserialize)]
            struct TestJson {
                test: Json<BTreeMap<String, i32>>,
            }

            let json: TestJson = tx
                .query("select ? as test", params![r#"{"test":1}"#])
                .await
                .unwrap()
                .fetch_one()
                .await
                .unwrap();

            assert_eq!(json.test["test"], 1);

            tx.commit().await.unwrap();
        }
    }
}
