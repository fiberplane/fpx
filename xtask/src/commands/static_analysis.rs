use std::{
    fs::{self},
    path::Path,
};

use anyhow::Result;
use tree_sitter::{Language, Parser, Point, TreeCursor};
use tree_sitter_typescript::{LANGUAGE_TSX, LANGUAGE_TYPESCRIPT};

#[derive(clap::Args, Debug)]
pub struct Args {
    #[arg(
        short,
        long,
        env,
        default_value = "/Users/steph/projects/fiberplane/goose-quotes/src/index.ts"
    )]
    pub entry_path: String,
}

#[derive(Debug, PartialEq)]
struct Handler {
    path: String,
    method: String,
    handler: String,
    point: Point,
}

pub async fn handle_command(args: Args) -> Result<()> {
    let file_path = Path::new(&args.entry_path);
    let source_code = fs::read_to_string(file_path).expect("entry file missing");

    let _handlers = find_handlers(&source_code);

    Ok(())
}

fn find_handlers(source_code: &str) -> Vec<Handler> {
    let mut handlers: Vec<Handler> = vec![];

    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE_TYPESCRIPT.into())
        .expect("Error loading TypeScript grammar");

    let tree = parser
        .parse(source_code, None)
        .expect("Failed to parse code");

    let root_node = tree.root_node();

    let mut cursor = root_node.walk();

    find_handler_nodes(&mut handlers, &mut cursor, source_code);

    handlers
}

fn find_handler_nodes(handlers: &mut Vec<Handler>, cursor: &mut TreeCursor, source_code: &str) {
    let node = cursor.node();

    if node.kind() == "call_expression" {
        let function_node = node.child(0).unwrap();
        let function_name = function_node.utf8_text(source_code.as_bytes()).unwrap();

        if function_name.contains(".get")
            || function_name.contains(".post")
            || function_name.contains(".patch")
            || function_name.contains(".put")
            || function_name.contains(".delete")
            || function_name.contains(".all")
        {
            if let Some(route_node) = node.child(1) {
                if let Some((_, method)) = function_name.split_once(".") {
                    if let Some(path_node) = route_node.child(1) {
                        let path = path_node
                            .child(1)
                            .unwrap()
                            .utf8_text(source_code.as_bytes())
                            .unwrap();

                        if let Some(handler_node) = route_node.child(3) {
                            let handler = handler_node.utf8_text(source_code.as_bytes()).unwrap();

                            handlers.push(Handler {
                                path: path.into(),
                                method: method.into(),
                                handler: handler.into(),
                                point: node.start_position(),
                            });
                        }
                    }
                }
            }
        }
    }

    if cursor.goto_first_child() {
        loop {
            find_handler_nodes(handlers, cursor, source_code);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let source_code = r#"
import { Hono } from "hono"
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
})

export default instrument(app);

        "#;

        let handlers = find_handlers(source_code);

        assert_eq!(
            handlers,
            vec![Handler {
                path: "/".into(),
                method: "get".into(),
                handler: "(c) => {\n  return c.text(\"Hello Hono!\");\n}".into(),
                point: Point { row: 6, column: 0 }
            }]
        )
    }
}
