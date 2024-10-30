use anyhow::Result;
use std::{
    // fs::{self},
    path::Path,
};

#[derive(clap::Args, Debug)]
pub struct Args {
    #[arg(short, long, env)]
    pub entry_path: String,
}

pub async fn handle_command(args: Args) -> Result<()> {
    let entry_path = Path::new(&args.entry_path);
    // let source = fs::read_to_string(entry_path).expect("entry file missing");

    fpx::static_analysis::ast::analyse(entry_path);

    // // TODO: Integrate fpx.toml?
    // let detected_routes = fpx::static_analysis::ast::detect_routes(entry_path, &source);
    //
    // println!("Count: {}", detected_routes.len());
    //
    // // TODO: Should probably serialize this to stdout?
    // for detected_route in detected_routes {
    //     println!("==============");
    //     println!("Handler:");
    //     println!("{}", detected_route);
    //     println!("==============");
    // }

    Ok(())
}
