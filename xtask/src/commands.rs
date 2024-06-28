use anyhow::Result;
use clap::{Parser, Subcommand};

mod otel_types;
mod schemas;

/// FPX - Super-charge your local development.
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    GenerateOtelTypes(otel_types::Args),
    GenerateSchemas(schemas::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::GenerateOtelTypes(args) => otel_types::handle_command(args).await,
        Command::GenerateSchemas(args) => schemas::handle_command(args).await,
    }
}
