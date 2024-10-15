use std::path::Path;

use super::detected_route::DetectedRoute;
use tree_sitter::{Parser, TreeCursor};
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

    let mut routes: Vec<DetectedRoute> = vec![];

    find_route_handler_nodes(entry_path, source, &mut routes, &mut cursor);

    routes
}

// TODO: find and traverse imports to match out of scope identifiers
fn find_route_handler_nodes(
    file_path: &Path,
    source: &str,
    routes: &mut Vec<DetectedRoute>,
    cursor: &mut TreeCursor,
) {
    let node = cursor.node();

    if node.kind() == "call_expression" {
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
            find_route_handler_nodes(file_path, source, routes, cursor);
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
