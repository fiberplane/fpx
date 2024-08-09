use anyhow::Result;
use clap::Subcommand;
use url::Url;

mod spans;

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
    /// Interact with stored spans
    Spans(spans::Args),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Spans(args) => spans::handle_command(args).await,
    }
}
