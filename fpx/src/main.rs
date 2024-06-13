use anyhow::{Context, Result};
use clap::Parser;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::runtime;
use opentelemetry_sdk::{trace, Resource};
use std::path::Path;
use tracing_opentelemetry::OpenTelemetryLayer;
use tracing_subscriber::layer::Layer;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

mod api;
mod commands;
pub mod data;
mod events;
mod inspector;

#[tokio::main]
async fn main() -> Result<()> {
    let args = commands::Args::parse();

    setup_tracing(&args)?;

    commands::handle_command(args).await
}

fn setup_tracing(args: &commands::Args) -> Result<()> {
    let filter_layer = EnvFilter::from_default_env();
    let log_layer = tracing_subscriber::fmt::layer().with_filter(EnvFilter::from_default_env());

    let trace_layer = if args.enable_tracing {
        // This tracer is responsible for sending the actual traces.
        let tracer = opentelemetry_otlp::new_pipeline()
            .tracing()
            .with_exporter(
                opentelemetry_otlp::new_exporter()
                    .http()
                    .with_endpoint(args.otlp_endpoint.to_string()),
            )
            .with_trace_config(
                trace::config()
                    .with_resource(Resource::new(vec![KeyValue::new("service.name", "fpx")])),
            )
            .install_batch(runtime::Tokio)
            // .install_simple()
            .context("unable to install tracer")?;

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
