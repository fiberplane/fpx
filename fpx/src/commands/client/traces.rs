use crate::api::client::ApiClient;
use anyhow::Result;
use clap::Subcommand;
use std::io::stdout;
use url::Url;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Get a single trace
    Get(GetArgs),

    /// List all traces
    List(ListArgs),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Get(args) => handle_get(args).await,
        Command::List(args) => handle_list(args).await,
    }
}

#[derive(clap::Args, Debug)]
pub struct GetArgs {
    /// TraceID - hex encoded
    pub trace_id: String,

    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,
}

async fn handle_get(args: GetArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    let result = api_client.trace_get(args.trace_id).await?;

    serde_json::to_writer_pretty(stdout(), &result)?;

    Ok(())
}

#[derive(clap::Args, Debug)]
pub struct ListArgs {
    /// TraceID - hex encoded
    pub trace_id: String,

    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,
}

async fn handle_list(args: ListArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    let result = api_client.span_list(args.trace_id).await?;

    serde_json::to_writer_pretty(stdout(), &result)?;

    Ok(())
}
