use crate::grpc::GrpcService;
use crate::initialize_fpx_dir;
use anyhow::{Context, Result};
use fpx::api::ApiConfig;
use fpx::data::libsql_store::LibsqlStore;
use fpx::events::memory::InMemoryEvents;
use fpx::{api, service};
use opentelemetry_proto::tonic::collector::trace::v1::trace_service_server::TraceServiceServer;
use std::future::IntoFuture;
use std::path::PathBuf;
use std::process::exit;
use std::sync::{Arc, RwLock};
use tokio::select;
use tracing::{error, info, warn};
use url::Url;

#[derive(clap::Args, Debug)]
pub struct Args {
    /// The address to listen on.
    #[arg(short, long, env, default_value = "127.0.0.1:6767")]
    pub listen_address: String,

    /// The address for the OTEL ingestion gRPC service to listen on.
    #[arg(long, env, default_value = "127.0.0.1:4567")]
    pub grpc_listen_address: String,

    /// The base URL of the server.
    #[arg(short, long, env, default_value = "http://localhost:6767")]
    pub base_url: url::Url,

    /// Enable in-memory database. Useful when debugging.
    #[clap(long, env, hide = true)]
    pub in_memory_database: bool,

    #[arg(from_global)]
    pub app_endpoint: Option<Url>,

    /// fpx directory
    #[arg(from_global)]
    pub fpx_directory: Option<PathBuf>,
}

pub async fn handle_command(args: Args) -> Result<()> {
    let fpx_directory = initialize_fpx_dir(&args.fpx_directory).await?;

    let store = if args.in_memory_database {
        LibsqlStore::in_memory().await?
    } else {
        LibsqlStore::file(&fpx_directory.join("fpx.db")).await?
    };

    LibsqlStore::migrate(&store).await?;

    let store = Arc::new(store);

    // Create a shared events struct, which allows events to be send to
    // WebSocket connections.
    let events = InMemoryEvents::new();
    let events = Arc::new(events);

    let service = service::Service::new(store.clone(), events.clone());

    let config = ApiConfig {
        base_url: Arc::new(RwLock::new(args.app_endpoint.map_or_else(
            || "http://localhost:8787".to_string(),
            |url| url.to_string(),
        ))),
    };

    let app =
        api::Builder::new()
            .enable_compression()
            .build(service.clone(), store.clone(), config);
    let grpc_service = GrpcService::new(service);

    let listener = tokio::net::TcpListener::bind(&args.listen_address)
        .await
        .with_context(|| format!("Failed to bind to address: {}", args.listen_address))?;

    // This future will resolve once `ctrl-c` is pressed.
    let api_shutdown = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to listen for ctrl-c");

        info!("Received SIGINT, shutting down api server");

        // Monitor for another SIGINT, and force shutdown if received.
        tokio::spawn(async {
            tokio::signal::ctrl_c()
                .await
                .expect("Failed to listen for ctrl-c");

            warn!("Received another SIGINT, forcing shutdown");
            exit(1);
        });
    };
    let grpc_shutdown = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to listen for ctrl-c");
    };

    info!(
        api_listen_address = ?listener.local_addr().context("Failed to get local address")?,
        grpc_listen_address = ?args.grpc_listen_address,
        "Starting server",
    );

    let task1 = axum::serve(listener, app)
        .with_graceful_shutdown(api_shutdown)
        .into_future();
    let task2 = tonic::transport::Server::builder()
        .add_service(TraceServiceServer::new(grpc_service))
        .serve_with_shutdown(args.grpc_listen_address.parse()?, grpc_shutdown);

    select!(
        result = task1 => {
            match result {
                Ok(_) => info!("API server shutdown gracefully"),
                Err(err) => error!(?err, "API server failed"),
            };
        },
        result = task2 => {
            match result {
                Ok(_) => info!("gRPC server shutdown gracefully"),
                Err(err) => error!(?err, "gRPC server failed"),
            };
        }
    );

    Ok(())
}
