use anyhow::Result;
use clap::Subcommand;
use url::Url;

mod inspectors;
mod requests;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,

    /// Base url of the fpx dev server.
    #[arg(
        global = true,
        short,
        long,
        env,
        default_value = "http://127.0.0.1:6767"
    )]
    pub base_url: Url,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Inspector related endpoints
    #[clap(hide = true)] // Not released yet
    Inspectors(inspectors::Args),

    /// List, retrieve, and delete RequestResponses
    Requests(requests::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Inspectors(args) => inspectors::handle_command(args).await,
        Command::Requests(args) => requests::handle_command(args).await,
    }
}
