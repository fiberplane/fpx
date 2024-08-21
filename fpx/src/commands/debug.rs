use crate::find_fpx_dir;
use anyhow::Result;
use clap::Subcommand;

mod ws;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Print the path to the FPX directory.
    FpxDirectory,

    /// Start a WebSocket connection to the server. This will dump any message
    /// it receives to the console.
    #[clap(alias = "ws")]
    WebSocket(ws::Args),
}
pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::FpxDirectory => handle_fpx_directory_command().await,
        Command::WebSocket(args) => ws::handle_command(args).await,
    }
}

pub async fn handle_fpx_directory_command() -> Result<()> {
    let fpx_directory = find_fpx_dir()?;
    match fpx_directory {
        Some(path) => eprintln!("Fpx directory found: {}", path.display()),
        None => eprintln!("Fpx directory not found"),
    }
    Ok(())
}
