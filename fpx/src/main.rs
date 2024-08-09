use anyhow::{Context, Result};
use clap::Parser;
use opentelemetry::trace::TracerProvider;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::runtime;
use opentelemetry_sdk::trace::Config;
use opentelemetry_sdk::Resource;
use std::env;
use std::path::Path;
use tracing::trace;
use tracing_opentelemetry::OpenTelemetryLayer;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

mod api;
mod commands;
pub mod data;
pub mod events;
pub mod grpc;
mod otel_util;

#[tokio::main]
async fn main() -> Result<()> {
    let args = commands::Args::parse();
    let should_shutdown_tracing = args.enable_tracing;

    setup_tracing(&args)?;

    let result = commands::handle_command(args).await;

    if should_shutdown_tracing {
        trace!("Shutting down tracers");
        shutdown_tracing();
    }

    result
}

fn setup_tracing(args: &commands::Args) -> Result<()> {
    let filter_layer = {
        let directives = env::var("RUST_LOG").unwrap_or_else(|_| "fpx=info,error".to_string());
        EnvFilter::builder().parse(directives)?
    };

    let log_layer = tracing_subscriber::fmt::layer();

    let trace_layer = if args.enable_tracing {
        // This tracer is responsible for sending the actual traces.
        let tracer_provider = opentelemetry_otlp::new_pipeline()
            .tracing()
            .with_exporter(
                opentelemetry_otlp::new_exporter()
                    .tonic()
                    .with_endpoint(args.otlp_endpoint.to_string()),
            )
            .with_trace_config(
                Config::default()
                    .with_resource(Resource::new(vec![KeyValue::new("service.name", "fpx")])),
            )
            .install_batch(runtime::Tokio)
            .context("unable to install tracer")?;

        opentelemetry::global::set_tracer_provider(tracer_provider.clone());

        let tracer = tracer_provider.tracer("fpx");

        // This layer will take the traces from the `tracing` crate and send
        // them to the tracer specified above.
        Some(OpenTelemetryLayer::new(tracer))
    } else {
        None
    };

    Registry::default()
        .with(filter_layer)
        .with(log_layer)
        .with(trace_layer)
        .try_init()
        .context("unable to initialize logger")?;

    Ok(())
}

fn shutdown_tracing() {
    opentelemetry::global::shutdown_tracer_provider();
}

/// Ensure that all the necessary directories are created for fpx.
///
/// This includes the top level fpx working directory and many of the
/// directories for other modules.
async fn initialize_fpx_dir(path: &Path) -> Result<()> {
    // Create top level fpx directory
    std::fs::DirBuilder::new()
        .recursive(true)
        .create(path)
        .with_context(|| format!("Failed to create fpx working directory: {:?}", path))?;

    // Create inspectors directory
    std::fs::DirBuilder::new()
        .recursive(true)
        .create(path.join("inspectors"))
        .with_context(|| format!("Failed to create fpx working directory: {:?}", path))?;

    Ok(())
}
