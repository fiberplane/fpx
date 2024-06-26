fn main() -> Result<(), Box<dyn std::error::Error>> {
    // tonic_build::compile_protos(
    // "../opentelemetry-proto/opentelemetry/proto/collector/trace/v1/trace_service.proto",
    // )?;

    // tonic_build::configure()
    //     .build_server(true)
    //     .build_client(false)
    //     .emit_rerun_if_changed(true)
    //     .include_file("../open-telemetry-proto/opentelemetry/proto")
    //     .proto_path("../opentelemetry-proto/opentelemetry/proto/collector/trace/v1/trace_service.proto")
    //     .comp

    tonic_build::configure()
        .include_file("opentelemetry_proto.rs")
        .build_client(false)
        .build_server(true)
        .compile(
            &["../opentelemetry-proto/opentelemetry/proto/collector/trace/v1/trace_service.proto"],
            &["../opentelemetry-proto"],
        )?;

    Ok(())
}
