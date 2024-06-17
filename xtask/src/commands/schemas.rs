use std::{fs::File, io::Write};

use anyhow::Result;
use fpx::schemas::{MyOtherStruct, MyStruct};
use schemars::schema_for;
use serde_json::Value;

#[derive(clap::Args, Debug)]
pub struct Args {}

// TODO: Clean up
pub async fn handle_command(_args: Args) -> Result<()> {
    let schemas = Vec::from([schema_for!(MyStruct), schema_for!(MyOtherStruct)]);

    let mut zod_schemas: Vec<String> = Vec::new();

    for (index, schema) in schemas.iter().enumerate() {
        let schema_string = serde_json::to_string_pretty(&schema)?;
        let schema_json = serde_json::to_value(&schema)?;

        if let Some(title) = schema_json.get("title").and_then(Value::as_str) {
            // Execute npx CLI tool json-schema-to-zod and capture its output
            let output = std::process::Command::new("npx")
                .args(["json-schema-to-zod", "-n", &title, "-i", &schema_string])
                .current_dir("frontend")
                .output()?;

            if output.status.success() {
                let output = String::from_utf8_lossy(&output.stdout);

                let zod_schema = if index == 0 {
                    output.trim().to_string()
                } else {
                    // strip the zod imports for every schema after the first one, so we have a
                    // single zod import
                    output
                        .splitn(3, "\n")
                        .skip(2)
                        .map(|s| s.trim())
                        .collect::<Vec<&str>>()
                        .join("\n")
                };

                zod_schemas.push(zod_schema.to_string());
                // add inferred type export to the schema
                zod_schemas.push(format!("export type {} = z.infer<typeof {}>", title, title));
            } else {
                // TODO: Implement error handling
                println!("stderr: {}", String::from_utf8_lossy(&output.stderr));
            }
        }
    }

    // TODO: Clean up and improve (should probably use Clap arguments?)
    let mut file = File::create("frontend/src/schemas.ts")?;
    file.write_all(zod_schemas.join("\n\n").as_bytes())?;

    // Run formatter
    let output = std::process::Command::new("npx")
        .args(["@biomejs/biome", "format", "--write", "src/schemas.ts"])
        .current_dir("frontend")
        .output()?;

    if !output.status.success() {
        // TODO: Implement error handling
        println!("stderr: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}
