use std::{collections::HashMap, path::Path};

use super::detected_route::DetectedRoute;
use tree_sitter::{Node, Parser, TreeCursor};
use tree_sitter_typescript::LANGUAGE_TYPESCRIPT;

pub fn detect_routes(entry_path: &Path, source: &str) -> Vec<DetectedRoute> {
    let mut parser = Parser::new();

    parser
        .set_language(&LANGUAGE_TYPESCRIPT.into())
        .expect("error loading TypeScript grammar");

    let tree = parser
        .parse(source, None)
        .expect("failed to parse source file");

    let root_node = tree.root_node();
    let mut cursor = root_node.walk();

    let mut imports = HashMap::new();
    let mut routes: Vec<DetectedRoute> = vec![];

    find_route_handler_nodes(entry_path, source, &mut imports, &mut routes, &mut cursor);

    println!("imports: {:?}", imports);

    routes
}

fn process_import(node: &Node, source: &str) -> Option<(String, Vec<String>)> {
    let mut cursor = node.walk();
    let mut identifiers: Vec<String> = vec![];
    let mut file = String::new();

    for child in node.children(&mut cursor) {
        if child.kind() == "import_clause"
            || child.kind() == "namespace_import"
            || child.kind() == "import_specifier"
        {
            let named_imports = child.child(0).unwrap();
            let mut cursor = named_imports.walk();

            for named_import in named_imports.children(&mut cursor) {
                if named_import.kind() == "import_specifier" {
                    let identifier = named_import
                        .utf8_text(source.as_bytes())
                        .unwrap()
                        .to_string();

                    identifiers.push(identifier);
                }
            }
        }

        if child.kind() == "string" {
            file = child
                .child(1)
                .unwrap()
                .utf8_text(source.as_bytes())
                .unwrap()
                .to_string()
                .trim_matches('"')
                .to_string();
        }
    }

    // TODO: Should probably support alias' in ts config
    if file.starts_with("./") {
        Some((file, identifiers))
    } else {
        None
    }
}

// TODO: find and traverse imports to match out of scope identifiers
fn find_route_handler_nodes(
    file_path: &Path,
    source: &str,
    imports: &mut HashMap<String, Vec<String>>,
    routes: &mut Vec<DetectedRoute>,
    cursor: &mut TreeCursor,
) {
    let node = cursor.node();

    if node.kind() == "import_statement" {
        if let Some((file, identifiers)) = process_import(&node, source) {
            imports.insert(file, identifiers);
        }
    } else if node.kind() == "call_expression" {
        let function_node = node.child(0).unwrap();
        let function_name = function_node.utf8_text(source.as_bytes()).unwrap();

        if function_name.ends_with(".get")
            || function_name.ends_with(".post")
            || function_name.ends_with(".patch")
            || function_name.ends_with(".put")
            || function_name.ends_with(".delete")
            || function_name.ends_with(".all")
        {
            if let Some(route_node) = node.child(1) {
                if let Some((_, method)) = function_name.split_once(".") {
                    if let Some(path_node) = route_node.child(1) {
                        let path = path_node
                            .child(1)
                            .unwrap()
                            .utf8_text(source.as_bytes())
                            .unwrap();

                        if let Some(handler_node) = route_node.child(3) {
                            let route_handler = handler_node.utf8_text(source.as_bytes()).unwrap();

                            // TODO: Find identifiers that are in the imports

                            routes.push(DetectedRoute {
                                route_path: path.into(),
                                route_method: method.into(),
                                route_handler: route_handler.into(),
                                source_path: file_path.to_str().unwrap().into(),
                                source_start_point: node.start_position().into(),
                                source_end_point: node.end_position().into(),
                            });
                        }
                    }
                }
            }
        }
    }

    if cursor.goto_first_child() {
        loop {
            find_route_handler_nodes(file_path, source, imports, routes, cursor);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

#[cfg(test)]
mod tests {
    use tree_sitter::Point;

    use super::*;

    #[test]
    fn named_hono_import() {
        let source_code = r#"
import { Hono } from "hono"
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default instrument(app);
        "#
        .trim();

        #[allow(clippy::needless_borrow)]
        let handlers = detect_routes(&Path::new("src/index.ts"), source_code);

        assert_eq!(
            handlers,
            vec![DetectedRoute {
                route_path: "/".into(),
                route_method: "get".into(),
                route_handler: "(c) => {\n  return c.text(\"Hello Hono!\");\n}".into(),
                source_path: "src/index.ts".into(),
                source_start_point: Point { row: 5, column: 0 }.into(),
                source_end_point: Point { row: 7, column: 2 }.into()
            }]
        )
    }
}
