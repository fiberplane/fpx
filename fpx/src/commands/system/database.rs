use anyhow::Result;
use clap::Subcommand;
use std::path::PathBuf;
use tracing::{error, info};

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,

    /// fpx directory
    #[arg(from_global)]
    pub fpx_directory: PathBuf,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Inspector related endpoints
    Delete,
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Delete => handle_delete_database(args).await,
    }
}

pub async fn handle_delete_database(args: Args) -> Result<()> {
    match tokio::fs::remove_file(args.fpx_directory.join("fpx.db")).await {
        Ok(_) => info!("Database deleted"),
        Err(err) => error!(?err, "Failed to delete database"),
    };

    Ok(())
}
