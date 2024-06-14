use crate::api;
use crate::data::migrations::migrate;
use crate::data::{DataPath, Store};
use crate::events::Events;
use crate::initialize_fpx_dir;
use anyhow::{Context, Result};
use std::{path::PathBuf, process::exit};
use tracing::info;
use tracing::warn;

#[derive(clap::Args, Debug)]
pub struct Args {
    /// The address to listen on.
    #[arg(short, long, env, default_value = "127.0.0.1:6767")]
    pub listen_address: String,

    /// The base URL of the server.
    #[arg(short, long, env, default_value = "http://localhost:6767")]
    pub base_url: url::Url,

    /// Enable in-memory database. Useful when debugging.
    #[clap(long, env, hide = true)]
    pub in_memory_database: bool,

    /// fpx directory
    #[arg(from_global)]
    pub fpx_directory: PathBuf,
}

pub async fn handle_command(args: Args) -> Result<()> {
    initialize_fpx_dir(args.fpx_directory.as_path()).await?;

    let store = open_store(&args).await?;

    migrate(&store).await?;

    // Create a shared events struct, which allows events to be send to
    // WebSocket connections.
    let events = Events::new();

    let inspector_service = crate::inspector::InspectorService::start(
        args.fpx_directory.join("inspectors"),
        store.clone(),
        events.clone(),
    )
    .await?;

    let app = api::create_api(args.base_url.clone(), events, store, inspector_service).await;

    let listener = tokio::net::TcpListener::bind(&args.listen_address)
        .await
        .with_context(|| format!("Failed to bind to address: {}", args.listen_address))?;

    // This future will resolve once `ctrl-c` is pressed.
    let shutdown = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to listen for ctrl-c");

        info!("Received SIGINT, shutting down server");

        // Monitor for another SIGINT, and force shutdown if received.
        tokio::spawn(async {
            tokio::signal::ctrl_c()
                .await
                .expect("Failed to listen for ctrl-c");

            warn!("Received another SIGINT, forcing shutdown");
            exit(1);
        });
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

async fn open_store(args: &Args) -> Result<Store> {
    let db_path = if args.in_memory_database {
        DataPath::InMemory
    } else {
        DataPath::File(args.fpx_directory.join("fpx.db"))
    };

    let store = Store::open(db_path).await?;

    Ok(store)
}
