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
    /// Inspector related endpoints
    #[clap(hide = true)] // Not released yet
    Database(database::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Database(args) => database::handle_command(args).await,
    }
}
