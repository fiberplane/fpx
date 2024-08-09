use crate::api::{client::ApiClient, models::NewRequest};
use anyhow::Result;
use clap::Subcommand;
use std::{collections::BTreeMap, io::stdout};
use url::Url;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Get a request
    Get(GetArgs),

    /// List requests
    List(ListArgs),

    /// Create and execute a request
    Call(CallArgs),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Get(args) => get_request(args).await,
        Command::List(args) => list_requests(args).await,
        Command::Call(args) => call_request(args).await,
    }
}

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

#[derive(clap::Args, Debug)]
pub struct CallArgs {
    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,

    /// HTTP method to use (e.g., GET, POST, PUT, DELETE).
    #[arg(long, default_value = "GET")]
    pub method: String,

    /// Target URL for the request.
    #[arg(long)]
    pub url: String,

    /// Request headers in the format `key1:value1,key2:value2`.
    #[arg(long, default_value = "")]
    pub headers: String,

    /// Request body.
    #[arg(long, default_value = "")]
    pub body: String,
}

async fn call_request(args: CallArgs) -> Result<()> {
    let mut headers_map = BTreeMap::new();
    if !args.headers.is_empty() {
        for header in args.headers.split(',') {
            let parts: Vec<&str> = header.split(':').collect();
            if parts.len() == 2 {
                headers_map.insert(parts[0].trim().to_string(), parts[1].trim().to_string());
            }
        }
    }

    let new_request = NewRequest {
        method: args.method,
        url: args.url,
        body: if args.body.is_empty() {
            None
        } else {
            Some(args.body)
        },
        headers: if headers_map.is_empty() {
            None
        } else {
            Some(headers_map)
        },
    };

    let api_client = ApiClient::new(args.base_url.clone());

    let request = api_client.request_create(new_request).await?;

    serde_json::to_writer_pretty(stdout(), &request)?;

    Ok(())
}
