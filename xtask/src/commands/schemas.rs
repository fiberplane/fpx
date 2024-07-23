use std::{fs::File, io::Write, path::Path};

use anyhow::Result;
use fpx::models::{
    ClientMessage, Request, RequestAdded, RequestSummary, RequestorError, RequestorRequestPayload,
    ServerMessage,
};
use schemars::{schema::RootSchema, schema_for};
use serde_json::Value;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[arg(short, long, env, default_value = "frontend")]
    pub project_directory: String,
    #[arg(short, long, env, default_value = "src/schemas.ts")]
    pub output_path: String,
}

pub async fn handle_command(args: Args) -> Result<()> {
    // Define which types should be used to generate schemas
    let schemas = Vec::from([
        schema_for!(ClientMessage),
        schema_for!(Request),
        schema_for!(RequestSummary),
        schema_for!(RequestAdded),
        schema_for!(RequestorError),
        schema_for!(RequestorRequestPayload),
        schema_for!(ServerMessage),
    ]);

    let zod_schema = generate_zod_schemas(&args.project_directory, &schemas)?;

    let file_path = Path::new(&args.project_directory).join(args.output_path.clone());
    let mut file = File::create(file_path.clone())?;
    file.write_all(&zod_schema)?;

    // Run formatter
    let output = std::process::Command::new("npx")
        .args([
            "@biomejs/biome",
            "format",
            "--write",
            args.output_path.as_str(),
        ])
        .current_dir(args.project_directory)
        .output()?;

    if !output.status.success() {
        eprintln!(
            "Failed to run Biome: {}",
            String::from_utf8_lossy(&output.stderr)
        );

        anyhow::bail!("Command failed")
    }

    println!(
        "Succesfully generated schemas at: {}",
        file_path.to_str().unwrap()
    );

    Ok(())
}

fn generate_zod_schemas(npx_directory: &str, schemas: &[RootSchema]) -> Result<Vec<u8>> {
    println!("Generating types & schemas:");
    let mut zod_schemas: Vec<String> = Vec::from([String::from(
        "// ================================================= //
        // This file is generated. PLEASE DO NOT MODIFY.     //
        // Run `cargo xtask generate-schemas` to regenerate. //
        // ================================================= //",
    )]);

    for (index, schema) in schemas.iter().enumerate() {
        // Parse the json schema as JSON and get the schema title
        let schema_json = serde_json::to_value(schema)?;

        if let Some(title) = schema_json.get("title").and_then(Value::as_str) {
            let schema_name = format!("{}Schema", title);
            // Convert the schema to a pretty string
            let schema_string = serde_json::to_string_pretty(&schema)?;

            // Execute npx CLI tool json-schema-to-zod and capture its output
            let output = std::process::Command::new("npx")
                .args([
                    "json-schema-to-zod",
                    "-n",
                    &schema_name,
                    "-i",
                    &schema_string,
                ])
                .current_dir(npx_directory)
                .output()?;

            if output.status.success() {
                let output = String::from_utf8_lossy(&output.stdout);

                let zod_schema = if index == 0 {
                    output.trim().to_string()
                } else {
                    // strip the zod imports for every schema after the first one, so we have a
                    // single zod import
                    output
                        .splitn(3, '\n')
                        .skip(2)
                        .map(|s| s.trim())
                        .collect::<Vec<&str>>()
                        .join("\n")
                };

                zod_schemas.push(zod_schema.to_string());
                // add inferred type export to the schema
                zod_schemas.push(format!(
                    "export type {} = z.infer<typeof {}>",
                    title, schema_name
                ));
                println!("✓ {}", title);
            } else {
                eprintln!(
                    "Generating {} failed: {}",
                    title,
                    String::from_utf8_lossy(&output.stderr)
                );

                anyhow::bail!("Command failed")
            }
        }
    }

    Ok(zod_schemas.join("\n\n").as_bytes().to_owned())
}
