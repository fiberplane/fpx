use crate::api;
use crate::events::Events;
use crate::github::GitHubCrawler;
use anyhow::{Context, Result};
use std::sync::Arc;
use std::time::Duration;
use tracing::{error, info};

#[derive(clap::Args, Debug)]
pub struct Args {
    /// The address to listen on.
    #[arg(short, long, env, default_value = "127.0.0.1:6767")]
    pub listen_address: String,
}

pub async fn handle_command(args: Args) -> Result<()> {
    // Create a shared events struct, which allows events to be send to
    // WebSocket connections.
    let events = Arc::new(Events::new());

    if let Some(github_token) = std::option_env!("GITHUB_TOKEN") {
        let local_events = events.clone();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_secs(5)).await;

            info!("Actually starting the GitHub crawler");
            let mut github_crawler = GitHubCrawler::new(local_events, ".", github_token);
            let result = github_crawler.run().await.context("unable to crawl github");
            match result {
                Ok(_) => info!("GitHub crawler finished"),
                Err(e) => error!("GitHub crawler failed: {:?}", e),
            }
        });
    }

    let app = api::create_api(events).await;

    let listener = tokio::net::TcpListener::bind(&args.listen_address)
        .await
        .with_context(|| format!("Failed to bind to address: {}", args.listen_address))?;

    // This future will resolve once `ctrl-c` is pressed.
    let shutdown = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to listen for ctrl-c");

        info!("Received SIGINT, shutting down server");
    };

    info!(
        listen_address = ?listener.local_addr().context("Failed to get local address")?,
        "Starting server",
    );

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown)
        .await
        .context("Failed to start the HTTP server")?;

    info!("Server shutdown gracefully");

    Ok(())
}
