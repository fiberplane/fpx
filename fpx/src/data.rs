use crate::api::types::Request;
use anyhow::{Context, Result};
use libsql::{params, Builder, Connection, Transaction};
use std::collections::BTreeMap;
use std::fmt::Display;
use std::path::{Path, PathBuf};

pub mod migrations;

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

    pub async fn start_transaction(&self) -> Result<Transaction> {
        self.connection
            .transaction()
            .await
            .context("Unable to start a transaction")
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
        let mut rows = tx
            .query(
                "INSERT INTO requests (method, url, body, headers) VALUES (?, ?, ?, ?) RETURNING id, method, url, body, headers",
                (method, url, body, headers),
            )
            .await
            .context("Unable to create request")?;

        // Get the first row which contains the only result.
        let row = rows.next().await.context("Unable to get row")?;
        let result = match row {
            Some(row) => row.get::<i64>(0)?,
            None => anyhow::bail!("Unable to get last insert rowid"),
        };

        // Make sure that there is only 1 row.
        let row = rows.next().await.context("Unable to get row")?;
        if row.is_some() {
            anyhow::bail!("Unable to get last insert rowid");
        }

        Ok(result)
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_list(_tx: &Transaction) -> Result<Vec<Request>> {
        todo!()
    }

    #[tracing::instrument(skip_all)]
    pub async fn request_get(&self, tx: &Transaction, id: i64) -> Result<Request> {
        let mut rows = tx
            .query(
                "SELECT id, method, url, body, headers FROM requests WHERE id = ?",
                params!(id),
            )
            .await
            .context("Unable to create request")?;

        // Get the first row which contains the only result.
        let row = rows.next().await.context("Unable to get row")?;
        let result = match row {
            Some(row) => {
                let headers: String = row.get(4)?;
                let headers = serde_json::from_str(&headers)?;
                Request::new(row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, headers)
            }
            None => anyhow::bail!("Unable to get request"),
        };

        // Make sure that there is only 1 row.
        let row = rows.next().await.context("Unable to get row")?;
        if row.is_some() {
            anyhow::bail!("Unable to get last insert rowid");
        }

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use serde::Deserialize;
    use crate::data::Store;
    use crate::ext::RowsExt;

    #[tokio::test]
    async fn test_extensions() {
        let store = Store::in_memory().await.unwrap();

        {
            let mut tx = store.start_transaction().await.unwrap();

            #[derive(Deserialize)]
            struct Test {
                test: i32
            }

            let fone: Test = tx.query("select 1 as test", ())
                .await
                .unwrap()
                .fetch_one()
                .await
                .unwrap();

            // create a temporary table and immediately drop it. this returns 0 rows without using existing tables
            let fopt: Option<Test> = tx.query("create temporary table temp_table (id integer); drop table temp_table;", ())
                .await
                .unwrap()
                .fetch_optional()
                .await
                .unwrap();

            let fall: Vec<Test> = tx.query("select 1 as test union all select 2 union all select 3", ())
                .await
                .unwrap()
                .fetch_all()
                .await
                .unwrap();

            assert_eq!(fone.test, 1);

            assert!(fopt.is_none());

            assert_eq!(fall.len(), 3);
            assert_eq!(fall[0].test, 1);
            assert_eq!(fall[1].test, 2);
            assert_eq!(fall[2].test, 3);

            tx.commit().await.unwrap();
        }
    }
}
