use anyhow::Result;
use boon::{Compiler, Schemas};
use clap::{Parser, Subcommand};
use commands::{client, dev};
use schemars::{schema_for, JsonSchema};
use serde::{Deserialize, Serialize};
use serde_json::Value;
// use serde_json::Value;

mod api;
mod commands;
mod events;
mod types;

/// FPX - Super-charge your local development.
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Test client to interact with a local development server.
    Client(client::Args),

    /// Start a local development server.
    Dev(dev::Args),
}

#[derive(JsonSchema, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tester {
    #[validate(range(min = 1, max = 10))]
    pub my_int: i32,
    #[validate(regex(pattern = "^https://"))]
    pub my_url: String,
    pub my_server_message: ServerMessage,
}

#[derive(JsonSchema, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", tag = "t", content = "c")]
pub enum ServerMessage {
    Ack,
    Error,
    Otel,
}

#[tokio::main]
async fn main() -> Result<()> {
    let schema = schema_for!(Tester);
    // let schema = schema_for!(ServerMessage);

    let schema_string = serde_json::to_string(&schema).unwrap();

    println!("JSON Schema:");
    println!("{}", schema_string);
    println!("-----------");
    println!("-----------");

    let schema_url = "http://tmp/schema.json";
    let schema: Value = serde_json::from_str(&schema_string.as_str()).unwrap();
    let instance: Value = serde_json::from_str(r#"{"my_int": 1234, "my_url": "url!"}"#)?;

    let mut schemas = Schemas::new();
    let mut compiler = Compiler::new();
    compiler.add_resource(schema_url, schema.clone()).unwrap();
    let sch_index = compiler.compile(schema_url, &mut schemas).unwrap();
    let result = schemas.validate(&instance, sch_index);

    println!("JSON Schema validation:");
    match result {
        Ok(_) => println!("Valid!"),
        Err(e) => println!("Invalid {}", e),
    }

    println!("-----------");
    println!("-----------");
    let schema_json = serde_json::to_value(&schema).unwrap();
    if let Some(title) = schema_json.get("title").and_then(Value::as_str) {
        let output = std::process::Command::new("npx")
            .args(["json-schema-to-zod", "-n", &title, "-i", &schema_string])
            .current_dir("frontend")
            .output()
            .expect("Failed to run json-schema-to-zod");

        println!("TS Generator result:");
        println!("stdout: {}", String::from_utf8_lossy(&output.stdout));
        println!("stderr: {}", String::from_utf8_lossy(&output.stderr));
        println!("title: {}", title);
    }

    let args = Args::parse();

    tracing_subscriber::fmt::init();

    match args.command {
        Command::Client(args) => client::handle_command(args).await,
        Command::Dev(args) => dev::handle_command(args).await,
    }
}
