use anyhow::Result;
use clap::{Parser, Subcommand};
use commands::{client, dev};

mod api;
mod commands;
mod events;
mod types;

/// FPX - Super-charge your local development.
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Test client to interact with a local development server.
    Client(client::Args),

    /// Start a local development server.
    Dev(dev::Args),
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    init_tracing_opentelemetry::tracing_subscriber_ext::init_subscribers()?;
    tracing_subscriber::fmt::init();

    match args.command {
        Command::Client(args) => client::handle_command(args).await,
        Command::Dev(args) => dev::handle_command(args).await,
    }
}
