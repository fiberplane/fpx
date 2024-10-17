use crate::find_fpx_dir;
use anyhow::Result;
use clap::Subcommand;
use std::path::PathBuf;
use tracing::{error, info, warn};

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,

    /// fpx directory
    #[arg(from_global)]
    pub fpx_directory: Option<PathBuf>,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Delete the database files from the fpx directory.
    Delete,
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Delete => handle_delete_database(args).await,
    }
}

pub async fn handle_delete_database(args: Args) -> Result<()> {
    let Some(fpx_directory) = args.fpx_directory.or_else(find_fpx_dir) else {
        warn!("Unable to find fpx directory, skipped deleting database");
        return Ok(());
    };

    match tokio::fs::remove_file(fpx_directory.join("fpx.db")).await {
        Ok(_) => info!("Database deleted"),
        Err(err) => error!(?err, "Failed to delete database"),
    };

    Ok(())
}
