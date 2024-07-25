use super::{ReadTransaction, Store, Transaction, WriteTransaction};
use anyhow::{Context, Result};
use include_dir::Dir;
use libsql::params;
use tracing::{debug, trace};

// NOTE: We should probably create our own include, which will store it sorted,
//       as an array, and with just the name and sql as the expected types.
static MIGRATIONS: Dir<'_> = include_dir::include_dir!("$CARGO_MANIFEST_DIR/src/data/migrations");

static MIGRATIONS_BOOTSTRAP: &str = "
CREATE TABLE _fpx_migrations  (
    name TEXT PRIMARY KEY, -- This contains the name of the migration
    created_at REAL DEFAULT (unixepoch('subsec'))
) STRICT
";

/// Make sure that all migration have been applied.
///
/// This will first verify if the migrations table exists, and create it if
/// it doesn't. Then it will run all migrations in alphabetical order, that
/// have not been applied yet. This could mean that if a migration has been
/// added in between other migrations that it will be run.
#[tracing::instrument(skip(store))]
pub async fn migrate(store: &Store) -> Result<()> {
    debug!("Running migrations");

    let tx = store.start_readwrite_transaction().await?;
    migrations_bootstrap(&tx).await?;

    let already_applied_migrations = migrations_list(&tx).await?;

    let mut sorted_migrations: Vec<_> = MIGRATIONS
        .files()
        .filter_map(|entry| {
            if entry.path().extension()? != "sql" {
                None
            } else {
                Some((entry.path().file_stem()?.to_str()?, entry.contents_utf8()?))
            }
        })
        .collect();
    // Note sure how include_dir handles sorting, so make sure we always sort on
    // the name, so that we apply the migrations in the correct, expected order.
    sorted_migrations.sort_by(|(left_name, _), (right_name, _)| left_name.cmp(right_name));

    let mut applied_migrations = 0;
    for (current_migration, sql) in sorted_migrations {
        if already_applied_migrations
            .iter()
            .any(|run_migration| run_migration == current_migration)
        {
            trace!(?current_migration, "Skipping migration; already applied");
            continue;
        }

        debug!(?current_migration, "Applying migration");
        tx.execute(sql, ())
            .await
            .with_context(|| format!("Applying migration {current_migration} failed"))?;
        tx.execute(
            "INSERT INTO _fpx_migrations (name) VALUES (?)",
            params![current_migration],
        )
        .await?;
        applied_migrations += 1;
    }

    debug!(applied_migrations, "Migration complete");

    store.commit_transaction(tx).await?;

    Ok(())
}

/// Create the new migrations table if it does not exist.
async fn migrations_bootstrap<T>(tx: &Transaction<'_, T>) -> Result<()>
where
    T: WriteTransaction,
{
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
        tx.execute(MIGRATIONS_BOOTSTRAP, ())
            .await
            .context("Unable to create migrations table")?;
        trace!("Successfully bootstrapped migrations");
    }

    Ok(())
}

/// List already applied migrations.
async fn migrations_list<T>(tx: &Transaction<'_, T>) -> Result<Vec<String>>
where
    T: ReadTransaction,
{
    let mut results = vec![];

    let sql = "SELECT name, created_at FROM _fpx_migrations ORDER BY name ASC";
    let mut rows = tx
        .query(sql, ())
        .await
        .context("Unable to check for the migrations table")?;

    while let Some(row) = rows.next().await? {
        let name: String = row.get(0)?;
        results.push(name);
    }

    Ok(results)
}
