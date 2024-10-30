use anyhow::Result;
use std::path::PathBuf;

#[derive(clap::Args, Debug)]
pub struct Args {
    #[arg(short, long, env)]
    pub entry_path: PathBuf,
}

pub async fn handle_command(args: Args) -> Result<()> {
    let result = fpx::static_analysis::ast::analyze(&args.entry_path);

    dbg!(result);

    Ok(())
}
