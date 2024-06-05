use anyhow::Result;
use clap::{Parser, Subcommand};
use url::Url;

pub mod client;
pub mod debug;
pub mod dev;

/// FPX - Super-charge your local development.
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    #[command(subcommand)]
    command: Command,

    /// Enable tracing
    #[arg(short, long, default_value = "false")]
    pub enable_tracing: bool,

    /// Endpoint of the OTLP collector.
    #[clap(long, env, default_value = "http://localhost:4317")]
    pub otlp_endpoint: Url,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Debug related commands.
    Client(client::Args),

    /// Debug related commands.
    Debug(debug::Args),

    /// Start a local development server.
    Dev(dev::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Client(args) => client::handle_command(args).await,
        Command::Debug(args) => debug::handle_command(args).await,
        Command::Dev(args) => dev::handle_command(args).await,
    }
}
