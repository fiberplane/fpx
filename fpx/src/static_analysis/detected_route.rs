use schemars::JsonSchema;
use std::{cmp::Ordering, fmt::Display};

#[derive(JsonSchema, Debug, PartialEq)]
pub struct DetectedRoute {
    pub route_path: String,
    pub route_method: String,
    pub route_handler: String,
    pub source_path: String,
    pub source_start_point: Point,
    pub source_end_point: Point,
    pub out_of_scope_sources: Vec<String>,
}

impl Eq for DetectedRoute {}

#[derive(JsonSchema, Debug, PartialEq)]
pub struct Point {
    pub row: usize,
    pub column: usize,
}

impl From<tree_sitter::Point> for Point {
    fn from(point: tree_sitter::Point) -> Self {
        Self {
            row: point.row,
            column: point.column,
        }
    }
}

impl Ord for DetectedRoute {
    fn cmp(&self, other: &Self) -> Ordering {
        self.route_path.cmp(&other.route_path)
    }
}

impl PartialOrd for DetectedRoute {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(&other))
    }
}

// TODO: temp
impl Display for DetectedRoute {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Method: {}\nRoute Path: {}\nSource Path: {}\nStart Point: {:?}\nEnd Point: {:?}\nRoute Handler:\n {}\n\nOut of scope:\n{}",
            self.route_method,
            self.route_path,
            self.source_path,
            self.source_start_point,
            self.source_end_point,
            self.route_handler,
            self.out_of_scope_sources.join("\n"),
        )
    }
}
