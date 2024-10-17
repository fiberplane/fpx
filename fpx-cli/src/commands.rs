use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use url::Url;

pub mod client;
pub mod debug;
pub mod dev;
pub mod system;

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

    #[clap(global = true, long, env, default_value = "http://localhost:8787")]
    pub app_endpoint: Url,

    /// Change the fpx directory.
    ///
    /// By default fpx will search for a `.fpx` directory in the current
    /// directory or its ancestors. If it wasn't found it will create a `.fpx`
    /// directory in the current directory.
    #[arg(global = true, short, long, env)]
    pub fpx_directory: Option<PathBuf>,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// A cli client to interact with a running fpx dev server.
    Client(client::Args),

    /// Debug related commands.
    #[clap(hide = true)]
    Debug(debug::Args),

    /// Start a local dev server.
    #[clap(aliases = &["up", "d", "start"])]
    Dev(dev::Args),

    /// System related commands.
    System(system::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Client(args) => client::handle_command(args).await,
        Command::Debug(args) => debug::handle_command(args).await,
        Command::Dev(args) => dev::handle_command(args).await,
        Command::System(args) => system::handle_command(args).await,
    }
}
