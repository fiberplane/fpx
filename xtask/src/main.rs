use anyhow::Result;
use clap::Parser;

mod commands;

#[tokio::main]
async fn main() -> Result<()> {
    let args = commands::Args::parse();

    commands::handle_command(args).await
}
