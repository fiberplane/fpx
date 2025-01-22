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
    /// Start a WebSocket connection to the server. This will dump any message
    /// it receives to the console.
    #[clap(alias = "ws")]
    WebSocket(ws::Args),
}
pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::WebSocket(args) => ws::handle_command(args).await,
    }
}
