use anyhow::{Context, Result};
use clap::Subcommand;
use url::Url;

use crate::inspector::InspectorConfig;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Create a new inspector
    Create(CreateArgs),
}

pub async fn handle_command(args: Args) -> Result<()> {
    match args.command {
        Command::Create(args) => create_inspector(args).await,
    }
}

/// Temporary inline this code into this module
///
#[derive(clap::Args, Debug)]
pub struct CreateArgs {
    /// Base url of the fpx dev server.
    #[arg(from_global)]
    pub base_url: Url,

    /// Name of the inspector.
    pub name: String,

    /// Port of the inspector.
    pub port: u16,
}

async fn create_inspector(args: CreateArgs) -> Result<()> {
    let client = reqwest::Client::new();
    let url = args.base_url.join("api/inspectors").unwrap();

    let inspector_config = InspectorConfig {
        name: args.name,
        port: args.port,
        upstream_protocol: "https".to_owned(),
        upstream_host: "google.com".to_owned(),
        upstream_port: 443,
    };

    let response = client
        .post(url)
        .json(&inspector_config)
        .send()
        .await
        .context("Unable to send request")?
        .error_for_status()
        .context("Invalid response status")?;

    Ok(())
}
