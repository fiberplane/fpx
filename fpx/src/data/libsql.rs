use crate::api::types::Request;
use anyhow::{Context, Result};
use libsql::{params, Builder, Connection, Database, Transaction};
use std::collections::BTreeMap;
use std::fmt::Display;
use std::path::{Path, PathBuf};
use tracing::{debug, trace};

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

    /// Make sure that all migration have been applied.
    ///
    /// This will first verify if the migrations table exists, and create it if
    /// it doesn't. Then it will run all migrations in alphabetical order, that
    /// have not been applied yet. This could mean that if a migration has been
    /// added in between other migrations that it will be run.
    #[tracing::instrument(skip(self))]
    pub async fn migrations_run(&self) -> Result<()> {
        debug!("Running migrations");

        self.migrations_bootstrap().await?;

        let tx = self.start_transaction().await.unwrap(); // TODO

        let already_applied_migrations = self.migrations_list(&tx).await?;

        let mut applied_migrations = 0;
        for (name, sql) in MIGRATIONS {
            if already_applied_migrations.contains(&name.to_string()) {
                trace!(?name, "Skipping migration; already applied");
                continue;
            }

            debug!(?name, "Applying migration");
            tx.execute(sql, ())
                .await
                .with_context(|| format!("Applying migration {name} failed"))?;
            tx.execute(
                "INSERT INTO _fpx_migrations (name) VALUES (?)",
                params![name],
            )
            .await?;
            applied_migrations += 1;
        }

        debug!(applied_migrations, "Migration complete");

        tx.commit().await.unwrap(); // TODO

        Ok(())
    }

    /// Create the new migrations table if it does not exist.
    async fn migrations_bootstrap(&self) -> Result<()> {
        let tx = self.start_transaction().await.unwrap(); // TODO

        // First check if the migrations table exist
        let sql = "SELECT name FROM sqlite_master WHERE type='table' AND name='_fpx_migrations'";
        let mut results = tx
            .query(sql, ())
            .await
            .context("Unable to check for the migrations table")?;

        // Go through the results and check if the migrations table exists
        let migrations_table_exists = loop {
            match results.next().await? {
                Some(row) => {
                    let table_name: String = row.get(0)?;
                    if table_name == "_fpx_migrations" {
                        break true;
                    }
                }
                None => break false,
            };
        };

        if migrations_table_exists {
            trace!("Migrations table already exists");
        } else {
            trace!("Migrations table does not exist");
            tx.execute(include_str!("migrations/00000000_migrations.sql"), ())
                .await
                .context("Unable to create migrations table")?;
            trace!("Successfully bootstrapped migrations");
        }

        tx.commit().await.unwrap(); // TODO

        Ok(())
    }

    /// List already applied migrations.
    async fn migrations_list(&self, tx: &Transaction) -> Result<Vec<String>> {
        let mut results = vec![];

        let sql = "SELECT name, created_at FROM _fpx_migrations ORDER BY name ASC";
        let mut rows = tx
            .query(sql, ())
            .await
            .context("Unable to check for the migrations table")?;

        while let Some(row) = rows.next().await? {
            let name: String = row.get(0)?;
            let created_at: f64 = row.get(1)?;
            trace!("Migration {} applied at {}", name, created_at);

            results.push(name);
        }

        Ok(results)
    }

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

    pub async fn request_list(_tx: &Transaction) -> Result<Vec<Request>> {
        todo!()
    }

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

static MIGRATIONS: &[(&str, &str)] = &[(
    "20240604_create_requests",
    include_str!("migrations/20240604_create_requests.sql"),
)];
