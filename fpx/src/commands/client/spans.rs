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
    /// Get a span
    Get(GetArgs),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Get(args) => get_request(args).await,
    }
}

#[derive(clap::Args, Debug)]
pub struct GetArgs {
    /// TraceID - hex encoded
    pub trace_id: String,

    /// SpanID - hex encoded
    pub span_id: String,

    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,
}

async fn get_request(args: GetArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    let request = api_client.span_get(args.trace_id, args.span_id).await?;

    serde_json::to_writer_pretty(stdout(), &request)?;

    Ok(())
}
