use std::{fs::File, io::Write, path::Path};

use anyhow::Result;
use fpx::models::{
    ClientMessage, Request, RequestAdded, RequestorError, RequestorRequestPayload, ServerMessage,
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
        schema_for!(RequestAdded),
        schema_for!(RequestorError),
        schema_for!(RequestorRequestPayload),
        schema_for!(ServerMessage),
    ]);

    let schema_content = generate_schemas(&schemas)?;

    let file_path = Path::new(&args.project_directory).join(args.output_path.clone());
    let mut file = File::create(file_path.clone())?;
    file.write_all(&schema_content)?;

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

fn generate_schemas(schemas: &[RootSchema]) -> Result<Vec<u8>> {
    println!("Generating types & schemas:");

    let mut output: Vec<String> = Vec::from([String::from(
        "// ================================================= //
        // This file is generated. PLEASE DO NOT MODIFY.     //
        // Run `cargo xtask generate-schemas` to regenerate. //
        // ================================================= //
       
        import { Ajv } from \"ajv\";
        import { FromSchema } from \"json-schema-to-ts\";

        const ajv = new Ajv();
        ",
    )]);

    for schema in schemas.iter() {
        // Parse the json schema as JSON and get the schema title
        let schema_json = serde_json::to_value(schema)?;

        if let Some(title) = schema_json.get("title").and_then(Value::as_str) {
            let schema_name = format!("{}JsonSchema", title);

            let json_schema = serde_json::to_string_pretty(&schema)?;

            output.push(format!(
                "export const {} = {} as const;",
                schema_name, json_schema
            ));

            output.push(format!(
                "export const validate{} = ajv.compile({});",
                title, schema_name
            ));

            output.push(format!(
                "export type {} = FromSchema<typeof {}>;",
                title, schema_name
            ));

            println!("✓ {}", title);
        }
    }

    Ok(output.join("\n\n").as_bytes().to_owned())
}
