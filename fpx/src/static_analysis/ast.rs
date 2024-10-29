use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    str::FromStr,
};
use tree_sitter::{Node, Parser, Tree, TreeCursor};
use tree_sitter_typescript::LANGUAGE_TYPESCRIPT;

use super::detected_route::DetectedRoute;

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
        // println!("{:?}\n{}\n=============", path, source);
        // println!("Imports:");
        for (path, identifiers) in imports {
            // println!("{}:", path.to_str().unwrap());
            for identifier in identifiers {
                // println!("{}", identifier);
            }
        }
        // println!("==========");
    }

    for handler in &handlers {
        // println!("{}", handler);
    }

    handlers.sort();

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

                        let mut cursor = route_node.walk();
                        let handler_param = route_node
                            .children(&mut cursor)
                            .filter(|node| {
                                node.kind() == "call_expression" || node.kind() == "arrow_function"
                            })
                            .last();

                        if let Some(handler_node) = handler_param {
                            // route_node.child(3) {
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

fn relative_import_to_absolute_path(path: &Path, import_path_str: &str) -> PathBuf {
    let path_str = path.to_str().unwrap();
    let path = if path_str.ends_with(".ts")
        || path_str.ends_with(".tsx")
        || path_str.ends_with(".js")
        || path_str.ends_with(".jsx")
    {
        path.parent().unwrap()
    } else {
        path
    };

    let mut import_path = PathBuf::from_str(import_path_str).unwrap();
    if import_path.is_absolute() {
        if import_path.exists() {
            import_path
        } else {
            panic!(
                "absolute import path does not exists: {}",
                import_path.to_str().unwrap()
            );
        }
    } else {
        import_path.push(path);
        import_path.push(import_path_str.replace("./", ""));
        if import_path.is_dir() {
            import_path.push("index.ts");
            if import_path.exists() {
                return import_path;
            }

            import_path.pop();
            import_path.push("index.tsx");
            if import_path.exists() {
                return import_path;
            }

            import_path.pop();
            import_path.push("index.js");
            if import_path.exists() {
                return import_path;
            }

            import_path.pop();
            import_path.push("index.jsx");
            if import_path.exists() {
                return import_path;
            }

            panic!(
                "1. absolute import path does not exist:\n{:?}\n{:?}",
                path, import_path
            );
        } else {
            import_path.set_extension("ts");
            if import_path.exists() {
                return import_path;
            }

            import_path.set_extension("tsx");
            if import_path.exists() {
                return import_path;
            }

            import_path.set_extension("js");
            if import_path.exists() {
                return import_path;
            }

            import_path.set_extension("jsx");
            if import_path.exists() {
                return import_path;
            }

            panic!(
                "2. absolute import path does not exist:\n{:?}\n{:?}",
                path, import_path
            );
        }
    }

    // println!("{:?}", import_path);

    // // TODO: Figure out the correct path
    // let mut import_path = import_path_str.replace("./", "");
    // import_path.push_str(".ts");
    //
    // let absolute_path = path.join(import_path).to_str().unwrap().into();
    //
    // absolute_path
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
        if let Some(block_node) = node.named_child(0) {
            if let Some(identifier_node) = block_node.child(0) {
                if let Ok(variable_name) = identifier_node.utf8_text(source.as_bytes()) {
                    if variable_name == identifier {
                        let mut is_exported = false;

                        if let Some(parent) = node.parent() {
                            is_exported = parent.kind() == "export_statement";
                        }
                        if !is_exported {
                            if let Some(prev_sibling) = node.prev_sibling() {
                                is_exported = prev_sibling.kind() == "export_statement";
                            }
                        }

                        let declaration_prefix = if is_exported {
                            "export const "
                        } else {
                            "const "
                        };
                        let block_text = block_node.utf8_text(source.as_bytes()).unwrap();
                        out_of_scope_sources.push(format!("{}{}", declaration_prefix, block_text));
                    }
                }
            }
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::static_analysis::detected_route::Point;
    use pretty_assertions::assert_eq;
    use std::env;

    fn get_test_case_path(test_path: &str) -> PathBuf {
        let mut path = env::current_dir().unwrap();
        path.push("src/static_analysis/test-case");
        path.push(test_path);
        path
    }

    #[test]
    fn empty() {
        let path = get_test_case_path("empty/.empty");

        let detected_routes = analyse(path.as_path());

        assert_eq!(Vec::<DetectedRoute>::new(), detected_routes);
    }

    #[test]
    fn single() {
        let path = get_test_case_path("single/index.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![DetectedRoute {
                route_path: "/".into(),
                route_method: "get".into(),
                route_handler: r#"(c) => c.text("Hello, Hono!")"#.into(),
                source_path: path.as_path().to_str().unwrap().into(),
                source_start_point: Point { row: 4, column: 0 },
                source_end_point: Point { row: 4, column: 43 },
                out_of_scope_sources: vec![]
            }],
            detected_routes
        );
    }

    #[test]
    fn multiple() {
        let path = get_test_case_path("multiple/index.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![DetectedRoute {
                route_path: "/".into(),
                route_method: "get".into(),
                route_handler: r#"(c) => c.text("Hello, Hono!")"#.into(),
                source_path: path.as_path().to_str().unwrap().into(),
                source_start_point: Point { row: 4, column: 0 },
                source_end_point: Point { row: 4, column: 43 },
                out_of_scope_sources: vec![]
            }],
            detected_routes
        );

        // TODO: Maybe iterate by directory instead of entry file? Like the ts impl
        let path = get_test_case_path("multiple/other.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![
                DetectedRoute {
                    route_path: "/".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => {
  return c.json({});
}"#
                    .into(),
                    source_path: get_test_case_path("multiple/other.ts")
                        .as_path()
                        .to_str()
                        .unwrap()
                        .into(),
                    source_start_point: Point { row: 2, column: 0 },
                    source_end_point: Point { row: 4, column: 2 },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "/".into(),
                    route_method: "post".into(),
                    route_handler: r#"(c) => c.json({ hello: "world" })"#.into(),
                    source_path: get_test_case_path("multiple/other.ts")
                        .as_path()
                        .to_str()
                        .unwrap()
                        .into(),
                    source_start_point: Point { row: 5, column: 0 },
                    source_end_point: Point { row: 5, column: 48 },
                    out_of_scope_sources: vec![]
                }
            ],
            detected_routes
        );
    }

    #[test]
    fn split_routes() {
        let path = get_test_case_path("split-routes/index.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![
                DetectedRoute {
                    route_path: "/api/v1/projects".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => {
  return c.json(PROJECTS);
}"#
                    .into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 18, column: 0 },
                    source_end_point: Point { row: 20, column: 2 },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "/api/v1/projects/:id".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => {
  const id = Number.parseInt(c.req.param("id"));
  const project = PROJECTS.find((p) => p.id === id);
  return c.json(project);
}"#
                    .into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 22, column: 0 },
                    source_end_point: Point { row: 26, column: 2 },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "/api/v1/users".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => {
  return c.json(USERS);
}"#
                    .into(),
                    source_path: get_test_case_path("split-routes/users.ts")
                        .as_path()
                        .to_str()
                        .unwrap()
                        .into(),
                    source_start_point: Point { row: 17, column: 0 },
                    source_end_point: Point { row: 19, column: 2 },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "/api/v1/users/:id".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => {
  const id = Number.parseInt(c.req.param("id"));
  const user = USERS.find((u) => u.id === id);
  return c.json(user);
}"#
                    .into(),
                    source_path: get_test_case_path("split-routes/users.ts")
                        .as_path()
                        .to_str()
                        .unwrap()
                        .into(),
                    source_start_point: Point { row: 21, column: 0 },
                    source_end_point: Point { row: 25, column: 2 },
                    out_of_scope_sources: vec![]
                },
            ],
            detected_routes
        );
    }

    #[test]
    fn module_imports() {
        let path = get_test_case_path("module-imports/index.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![
                DetectedRoute {
                    route_path: "/".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => c.text("Hello, Hono!")"#.into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 6, column: 0 },
                    source_end_point: Point { row: 11, column: 1 },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "/slow".into(),
                    route_method: "get".into(),
                    route_handler: r#"async (c) => {
  await sleep(1000);
  return c.text("Hello, Hono (slow)!");
}"#
                    .into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 19, column: 0 },
                    source_end_point: Point { row: 22, column: 2 },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "user/1".into(),
                    route_method: "get".into(),
                    route_handler: r#"async (c) => {
  // await getUser();
  const user = await getUser();
  return c.json(user);
}"#
                    .into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 32, column: 0 },
                    source_end_point: Point { row: 36, column: 2 },
                    out_of_scope_sources: vec![
                        r#"export const getUser = measure("getUser", async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const value: User = {
    name: "John Doe",
    email: "john@doe.com",
  };
  return value;
})"#
                        .into()
                    ]
                }
            ],
            detected_routes
        );
    }

    #[test]
    fn bindings() {
        let path = get_test_case_path("bindings/index.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![DetectedRoute {
                route_path: "/".into(),
                route_method: "get".into(),
                route_handler: r#"(c) => {
  const headers = new Headers();
  c.env.GOOSE_AVATARS.put("test", new ReadableStream(), {
    httpMetadata: { contentType: "application/json" },
  });
  console.log("headers", headers);
  return c.text("Hello, Hono!");
}"#
                .into(),
                source_path: path.as_path().to_str().unwrap().into(),
                source_start_point: Point { row: 10, column: 0 },
                source_end_point: Point { row: 17, column: 2 },
                out_of_scope_sources: vec![]
            }],
            detected_routes
        );
    }

    #[test]
    fn barrel_files() {
        let path = get_test_case_path("barrel-files/index.ts");

        let detected_routes = analyse(path.as_path());

        assert_eq!(
            vec![
                DetectedRoute {
                    route_path: "/".into(),
                    route_method: "get".into(),
                    route_handler: r#"(c) => c.text("Hello, Hono!")"#.into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 20, column: 0 },
                    source_end_point: Point {
                        row: 20,
                        column: 43
                    },
                    out_of_scope_sources: vec![]
                },
                DetectedRoute {
                    route_path: "/user/1".into(),
                    route_method: "get".into(),
                    route_handler: r#"async (c) => {
  // await getUser();
  const user = await getUser();
  return c.json(user);
}"#
                    .into(),
                    source_path: path.as_path().to_str().unwrap().into(),
                    source_start_point: Point { row: 14, column: 0 },
                    source_end_point: Point { row: 18, column: 2 },
                    out_of_scope_sources: vec![
                        r#"export const getUser = measure("getUser", async () => {
  await sleep(100);
  const value: User = {
    name: DEFAULT_USER_NAME,
    email: DEFAULT_EMAIL,
  };
  return value;
})"#
                        .into(),
                    ]
                },
            ],
            detected_routes
        );
    }
}
