use super::detected_route::DetectedRoute;
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};
use tree_sitter::{Node, Parser, Tree, TreeCursor};
use tree_sitter_typescript::LANGUAGE_TYPESCRIPT;

type ModuleMap = HashMap<PathBuf, (String, ImportMap)>;
type ImportMap = HashMap<PathBuf, Vec<String>>;

pub fn analyse(entry_path: &Path) -> Vec<DetectedRoute> {
    let mut modules = ModuleMap::new();

    traverse_modules(entry_path, &mut modules);

    let mut handlers: Vec<DetectedRoute> = vec![];
    for (path, (source, imports)) in &modules {
        let tree = get_source_tree(source);
        let root_node = tree.root_node();
        let mut cursor = root_node.walk();
        detect_route_handlers(path, source, &mut cursor, &mut handlers, imports, &modules);
        println!("{:?}\n{}\n=============", path, source);
        println!("Imports:");
        for (path, identifiers) in imports {
            println!("{}:", path.to_str().unwrap());
            for identifier in identifiers {
                println!("{}", identifier);
            }
        }
        println!("==========");
    }

    for handler in &handlers {
        println!("{}", handler);
    }

    handlers
}

fn detect_route_handlers(
    path: &Path,
    source: &str,
    cursor: &mut TreeCursor,
    routes: &mut Vec<DetectedRoute>,
    imports: &ImportMap,
    modules: &ModuleMap,
) {
    let node = cursor.node();

    if node.kind() == "call_expression" {
        let function_node = node.child(0).unwrap();
        let function_name = function_node.utf8_text(source.as_bytes()).unwrap();

        // TODO: Make sure to check for the Hono app initialization and match identifiers instead of relying on `.{METHOD}`
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
                        let route_path = path_node
                            .child(1)
                            .unwrap()
                            .utf8_text(source.as_bytes())
                            .unwrap();

                        if let Some(handler_node) = route_node.child(3) {
                            let route_handler = handler_node.utf8_text(source.as_bytes()).unwrap();

                            let mut cursor = handler_node.walk();
                            let mut out_of_scope_sources: Vec<String> = vec![];

                            collect_out_of_scope_identifiers(
                                &mut cursor,
                                imports,
                                source,
                                &mut out_of_scope_sources,
                                modules,
                            );

                            routes.push(DetectedRoute {
                                route_path: route_path.into(),
                                route_method: method.into(),
                                route_handler: route_handler.into(),
                                source_path: path.to_str().unwrap().into(),
                                source_start_point: node.start_position().into(),
                                source_end_point: node.end_position().into(),
                                out_of_scope_sources,
                            });
                        }
                    }
                }
            }
        }
    }

    if cursor.goto_first_child() {
        loop {
            detect_route_handlers(path, source, cursor, routes, imports, modules);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

fn traverse_modules(path: &Path, modules: &mut ModuleMap) {
    let source = fs::read_to_string(path).expect("file missing");

    let tree = get_source_tree(&source);
    let root_node = tree.root_node();
    let mut cursor = root_node.walk();

    let mut imports = ImportMap::new();
    detect_imports(path, &mut cursor, &source, &mut imports);

    for path in imports.keys() {
        traverse_modules(path.as_path(), modules);
    }

    modules.insert(path.to_str().unwrap().into(), (source, imports));
}

fn get_source_tree(source: &str) -> Tree {
    let mut parser = Parser::new();

    parser
        .set_language(&LANGUAGE_TYPESCRIPT.into())
        .expect("error loading TypeScript grammar");

    parser
        .parse(source, None) //  TODO: handle watch?
        .expect("failed to parse source file")
}

fn detect_imports(path: &Path, cursor: &mut TreeCursor, source: &str, imports: &mut ImportMap) {
    let node = cursor.node();

    if node.kind() == "import_statement" {
        if let Some((import_path, identifiers)) = process_import(&node, source) {
            for identifier in identifiers {
                let absolute_path = relative_import_to_absolute_path(path, &import_path);

                if let Some(identifiers) = imports.get_mut(absolute_path.as_path()) {
                    identifiers.push(identifier);
                } else {
                    imports.insert(absolute_path, vec![identifier]);
                }
            }
        }
    }

    if cursor.goto_first_child() {
        loop {
            detect_imports(path, cursor, source, imports);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

fn relative_import_to_absolute_path(path: &Path, import_path: &str) -> PathBuf {
    let path = if path.to_str().unwrap().ends_with(".ts") {
        path.parent().unwrap()
    } else {
        path
    };

    // TODO: Figure out the correct path
    let mut import_path = import_path.replace("./", "");
    import_path.push_str(".ts");

    let absolute_path = path.join(import_path).to_str().unwrap().into();

    absolute_path
}

pub fn detect_out_of_scope_identifier(
    source: &str,
    identifier: &str,
    out_of_scope_sources: &mut Vec<String>,
) {
    let tree = get_source_tree(source);
    let root_node = tree.root_node();
    let mut cursor = root_node.walk();
    traverse_for_export_identifier(&mut cursor, source, identifier, out_of_scope_sources);
}

// TODO: Fix recursion bug, block is added multiple times
fn traverse_for_export_identifier(
    cursor: &mut TreeCursor,
    source: &str,
    identifier: &str,
    out_of_scope_sources: &mut Vec<String>,
) {
    let node = cursor.node();

    if node.kind() == "lexical_declaration" || node.kind() == "variable_declaration" {
        let block_node = node.named_child(0).unwrap();
        let identifier_node = block_node.child(0).unwrap();
        let variable_name = identifier_node.utf8_text(source.as_bytes()).unwrap();

        if variable_name == identifier {
            // TODO: Include block / export declaration
            let block_text = block_node.utf8_text(source.as_bytes()).unwrap();
            out_of_scope_sources.push(block_text.to_string());
        }
    }

    if cursor.goto_first_child() {
        loop {
            traverse_for_export_identifier(cursor, source, identifier, out_of_scope_sources);
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
    cursor: &mut TreeCursor,
    imports: &ImportMap,
    source: &str,
    out_of_scope_sources: &mut Vec<String>,
    modules: &ModuleMap,
) {
    let node = cursor.node();

    if node.kind() == "identifier" {
        let identifier = node.utf8_text(source.as_bytes()).unwrap().to_string();

        let import_with_identifier = imports
            .iter()
            .find(|(_, v)| v.contains(&identifier.to_string()));

        if let Some((import_path, _)) = import_with_identifier {
            let (out_of_scope_source, _) = modules.get(import_path).unwrap();
            detect_out_of_scope_identifier(out_of_scope_source, &identifier, out_of_scope_sources);
        }
    }

    if cursor.goto_first_child() {
        loop {
            collect_out_of_scope_identifiers(
                cursor,
                imports,
                source,
                out_of_scope_sources,
                modules,
            );
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

// #[cfg(test)]
// mod tests {
//     use tree_sitter::Point;
//
//     use super::*;
//
//     #[test]
//     fn named_hono_import() {
//         let source_code = r#"
// import { Hono } from "hono"
// import { instrument } from "@fiberplane/hono-otel";
//
// const app = new Hono();
//
// app.get("/", (c) => {
//   return c.text("Hello Hono!");
// });
//
// export default instrument(app);
//         "#
//         .trim();
//
//         #[allow(clippy::needless_borrow)]
//         let handlers = detect_routes(&Path::new("src/index.ts"), source_code);
//
//         assert_eq!(
//             handlers,
//             vec![DetectedRoute {
//                 route_path: "/".into(),
//                 route_method: "get".into(),
//                 route_handler: "(c) => {\n  return c.text(\"Hello Hono!\");\n}".into(),
//                 source_path: "src/index.ts".into(),
//                 source_start_point: Point { row: 5, column: 0 }.into(),
//                 source_end_point: Point { row: 7, column: 2 }.into(),
//                 out_of_scope_sources: vec![],
//             }]
//         )
//     }
// }
