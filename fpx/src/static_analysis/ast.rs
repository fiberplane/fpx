use super::detected_route::DetectedRoute;
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};
use tree_sitter::{Node, Parser, TreeCursor};
use tree_sitter_typescript::LANGUAGE_TYPESCRIPT;

type ImportMap = HashMap<String, String>;

pub fn detect_routes(entry_path: &Path, source: &str) -> Vec<DetectedRoute> {
    let mut parser = Parser::new();

    parser
        .set_language(&LANGUAGE_TYPESCRIPT.into())
        .expect("error loading TypeScript grammar");

    let tree = parser
        .parse(source, None) //  TODO: handle watch?
        .expect("failed to parse source file");

    let root_node = tree.root_node();
    let mut cursor = root_node.walk();

    let mut imports = HashMap::new();
    let mut routes: Vec<DetectedRoute> = vec![];

    find_route_handler_nodes(entry_path, source, &mut imports, &mut routes, &mut cursor);

    routes
}

pub fn detect_out_of_scope_identifier(import_path: &Path, source: &str, identifier: &str) {
    println!(
        "TODO: Find identifier '{}' in path '{:?}':\n{}",
        identifier, import_path, source
    );
}

// TODO: find and traverse imports to match out of scope identifiers
fn find_route_handler_nodes(
    entry_path: &Path,
    source: &str,
    imports: &mut ImportMap,
    routes: &mut Vec<DetectedRoute>,
    cursor: &mut TreeCursor,
) {
    let node = cursor.node();

    if node.kind() == "import_statement" {
        if let Some((import_path, identifiers)) = process_import(&node, source) {
            for identifier in identifiers {
                imports.insert(identifier, import_path.clone());
            }
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

                            // println!("rh:\n{}", route_handler);

                            let mut cursor = handler_node.walk();
                            let out_of_scope = collect_out_of_scope_identifiers(
                                entry_path,
                                &mut cursor,
                                &imports,
                                source,
                            );

                            routes.push(DetectedRoute {
                                route_path: path.into(),
                                route_method: method.into(),
                                route_handler: route_handler.into(),
                                source_path: entry_path.to_str().unwrap().into(),
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
            find_route_handler_nodes(entry_path, source, imports, routes, cursor);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

fn process_import(node: &Node, source: &str) -> Option<(String, Vec<String>)> {
    let mut cursor = node.walk();
    let mut identifiers: Vec<String> = vec![];
    let mut import_path = String::new();

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
            import_path = child
                .child(1)
                .unwrap()
                .utf8_text(source.as_bytes())
                .unwrap()
                .to_string()
                .trim_matches('"')
                .to_string();
        }
    }

    // TODO: Should probably support alias' in ts config, instead of just relative imports
    if import_path.starts_with("./") {
        Some((import_path, identifiers))
    } else {
        None
    }
}

fn collect_out_of_scope_identifiers(
    entry_path: &Path,
    cursor: &mut TreeCursor,
    imports: &ImportMap,
    source: &str,
) {
    let node = cursor.node();

    if node.kind() == "identifier" {
        let identifier = node.utf8_text(source.as_bytes()).unwrap().to_string();

        if let Some(import_path) = imports.get(&identifier) {
            let path = resolve_import(entry_path, import_path);
            // TODO: return path
            let path = Path::new(path.to_str().unwrap());

            let out_of_scope_source = fs::read_to_string(path).unwrap();
            detect_out_of_scope_identifier(path, &out_of_scope_source, &identifier);
        }
    }

    if cursor.goto_first_child() {
        loop {
            collect_out_of_scope_identifiers(entry_path, cursor, imports, source);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

// TODO: Improve import resolution
fn resolve_import(entry_path: &Path, import_path: &str) -> PathBuf {
    let entry_path = entry_path
        .to_str()
        .unwrap()
        .rsplitn(2, "/")
        .skip(1)
        .collect::<String>();

    let mut import_path = import_path.replace("./", "");
    import_path.push_str(".ts");

    PathBuf::from(entry_path).join(import_path)
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
