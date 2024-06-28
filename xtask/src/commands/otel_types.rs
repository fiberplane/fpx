use anyhow::{bail, Result};

#[derive(clap::Args, Debug)]
pub struct Args {
    /// Input .proto files.
    #[arg(short, long, env, default_values = ["opentelemetry-proto/opentelemetry/proto/collector/trace/v1/trace_service.proto"])]
    pub proto_files: Vec<String>,

    /// Include paths for other .proto files.
    #[arg(short, long, env, default_values = ["opentelemetry-proto"])]
    pub include_paths: Vec<String>,

    /// Name of the include file.
    #[arg(long, env, default_value = "mod.rs")]
    pub include_file: String,

    /// Directory where the generated Rust files will be created.
    #[arg(short, long, env, default_value = "fpx/src/models/otel")]
    pub output_path: String,
}

pub async fn handle_command(args: Args) -> Result<()> {
    if args.include_paths.is_empty() {
        bail!("No input paths were provided")
    }

    tonic_build::configure()
        .emit_rerun_if_changed(false)
        .message_attribute(
            ".",
            "#[derive(serde::Deserialize, serde::Serialize)] #[serde(rename_all = \"snake_case\")]",
        )
        .enum_attribute(
            ".",
            "#[derive(serde::Deserialize, serde::Serialize)] #[serde(rename_all = \"snake_case\")]",
        )
        .include_file(args.include_file)
        .build_client(false)
        .build_server(true)
        .out_dir(args.output_path)
        .compile(
            &args.proto_files,
            &args.include_paths,
            // &["../opentelemetry-proto/opentelemetry/proto/collector/trace/v1/trace_service.proto"],
            // &["../opentelemetry-proto"],
        )?;

    Ok(())
}
