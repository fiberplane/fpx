use anyhow::Result;
use clap::{Parser, Subcommand};

pub mod schemas;

/// FPX - Super-charge your local development.
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    GenerateSchemas(schemas::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::GenerateSchemas(args) => schemas::handle_command(args).await,
    }
}
