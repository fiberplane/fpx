use anyhow::{Context, Result};
use std::fs::{self};
use std::io::Write;
use std::path::PathBuf;
use typeshare_core::{language, process_input};

#[derive(clap::Args, Debug)]
pub struct Args {
    /// File containing the Rust types to convert
    #[arg(short, long, env, default_value = "fpx/src/api/types.rs")]
    pub input: PathBuf,

    /// File where the generated types will be saved, use "-" for stdout
    #[arg(short, long, env, default_value = "-")]
    pub output: String,
}

pub async fn handle_command(args: Args) -> Result<()> {
    let input_content = fs::read_to_string(&args.input)
        .with_context(|| format!("Unable to read input: {:?}", args.input))?;
    let mut language = language::TypeScript::default();

    // Either write to stdout or a file, depending on the argument
    let mut out: Box<dyn Write> = {
        if args.output == "-" {
            Box::new(std::io::stdout())
        } else {
            Box::new(
                fs::File::create(&args.output)
                    .with_context(|| format!("Unable to create output: {:?}", args.output))?,
            )
        }
    };

    process_input(&input_content, &mut language, out.as_mut())?;

    Ok(())
}
