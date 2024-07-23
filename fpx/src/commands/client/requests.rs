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
    /// Get a requests
    Get(GetArgs),
    // List requests
    List(ListArgs),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Get(args) => get_request(args).await,
        Command::List(args) => list_requests(args).await,
    }
}

/// Temporary inline this code into this module
///
#[derive(clap::Args, Debug)]
pub struct GetArgs {
    pub request_id: i64,

    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,
}

async fn get_request(args: GetArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    let request = api_client.request_get(args.request_id).await?;

    serde_json::to_writer_pretty(stdout(), &request)?;

    Ok(())
}

/// Temporary inline this code into this module
///
#[derive(clap::Args, Debug)]
pub struct ListArgs {
    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,
}

async fn list_requests(args: ListArgs) -> Result<()> {
    let api_client = ApiClient::new(args.base_url.clone());

    let request = api_client.request_list().await?;

    serde_json::to_writer_pretty(stdout(), &request)?;

    Ok(())
}
