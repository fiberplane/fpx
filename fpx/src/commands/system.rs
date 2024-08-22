use crate::find_fpx_dir;
use anyhow::Result;
use clap::Subcommand;

mod database;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Low level interaction with the database.
    Database(database::Args),

    /// Print the path to the FPX directory.
    FpxDirectory,
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Database(args) => database::handle_command(args).await,
        Command::FpxDirectory => handle_fpx_directory_command().await,
    }
}

pub async fn handle_fpx_directory_command() -> Result<()> {
    let fpx_directory = find_fpx_dir();
    match fpx_directory {
        Some(path) => eprintln!("Fpx directory found: {}", path.display()),
        None => eprintln!("Fpx directory not found"),
    }
    Ok(())
}
