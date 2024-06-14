use anyhow::{Context, Result};
use clap::Subcommand;
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
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Get(args) => create_inspector(args).await,
    }
}

/// Temporary inline this code into this module
///
#[derive(clap::Args, Debug)]
pub struct GetArgs {
    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,

    pub request_id: u64,
}

async fn create_inspector(args: GetArgs) -> Result<()> {
    let client = reqwest::Client::new();
    let url = args
        .base_url
        .join(&format!("api/requests/{}", args.request_id))
        .unwrap();

    let response = client
        .get(url)
        .send()
        .await
        .context("Unable to send request")?
        .error_for_status()
        .context("Invalid response status")?;

    println!("{}", response.text().await?);

    Ok(())
}
