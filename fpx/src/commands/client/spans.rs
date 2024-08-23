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
    /// Get a single span
    Get(GetArgs),

    /// List all spans for a single trace
    List(ListArgs),

    /// Delete a single span
    Delete(DeleteArgs),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Get(args) => handle_get(args).await,
        Command::List(args) => handle_list(args).await,
        Command::Delete(args) => handle_delete(args).await,
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

async fn handle_get(args: GetArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    let result = api_client.span_get(args.trace_id, args.span_id).await?;

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

#[derive(clap::Args, Debug)]
pub struct DeleteArgs {
    /// TraceID - hex encoded
    pub trace_id: String,

    /// SpanID - hex encoded
    pub span_id: String,

    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,
}

async fn handle_delete(args: DeleteArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    api_client.span_delete(args.trace_id, args.span_id).await?;

    Ok(())
}
