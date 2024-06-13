use crate::api::types::Request;
use anyhow::{Context, Result};
use libsql::{params, Builder, Connection, Database, Transaction};
use std::collections::BTreeMap;
use std::fmt::Display;
use std::path::{Path, PathBuf};

pub struct LibSqlStore {
    _database: Database,
    connection: Connection,
}

pub enum DataPath {
    InMemory,
    Local(PathBuf),
}

impl DataPath {
    pub fn as_path(&self) -> &Path {
        match self {
            DataPath::InMemory => Path::new(":memory:"),
            DataPath::Local(path) => path.as_path(),
        }
    }
}

impl Display for DataPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataPath::InMemory => write!(f, ":memory:"),
            DataPath::Local(path) => write!(f, "{}", path.display()),
        }
    }
}

impl LibSqlStore {
    /// Open a new store with the specified path
    pub async fn open(path: DataPath) -> Result<Self> {
        let database = Builder::new_local(path.as_path())
            .build()
            .await
            .with_context(|| format!("failed to build libSQL database object: {}", path))?;

        let connection = database
            .connect()
            .with_context(|| format!("failed to connect to libSQL database: {}", path))?;

        Ok(LibSqlStore {
            _database: database,
            connection,
        })
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
