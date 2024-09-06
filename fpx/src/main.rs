use anyhow::{Context, Result};
use clap::Parser;
use fpx_lib::config::FpxConfig;
use opentelemetry::trace::TracerProvider;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::trace::Config;
use opentelemetry_sdk::{runtime, Resource};
use std::env;
use std::path::PathBuf;
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

/// Ensure that the fpx directory exists and is initialized. It will return a
/// path to the fpx directory.
///
/// If override_path is provided than that path is used as the fpx directory. It
/// won't delete anything in that directory.
///
/// If no [`override_path`] is provided, it will search for the fpx directory
/// using the algorithm described in [`find_fpx_dir`]. If no directory is found,
/// then a .fpx directory is created in the current directory.
async fn initialize_fpx_dir(override_path: &Option<PathBuf>) -> Result<PathBuf> {
    trace!("Initializing fpx directory");
    let path = match override_path {
        Some(path) => {
            trace!(fpx_directory = ?path, "Using override path for fpx directory");
            path.to_path_buf()
        }
        None => match FpxConfig::find_root_directory() {
            Some(path) => {
                trace!(fpx_directory = ?path, "Found root directory in the current or a parent directory");
                path
            }
            None => {
                let path = env::current_dir()?.join(".fpx");
                trace!(fpx_directory = ?path, "No fpx directory found, using the current directory");
                path
            }
        },
    };

    // Create top level .fpx directory
    std::fs::DirBuilder::new()
        .recursive(true)
        .create(&path)
        .with_context(|| format!("Failed to create fpx working directory: {:?}", path))?;

    Ok(path)
}
