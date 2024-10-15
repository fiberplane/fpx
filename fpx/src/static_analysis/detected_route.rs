use std::fmt::Display;
use tree_sitter::Point;

#[derive(Debug, PartialEq)]
pub struct DetectedRoute {
    pub route_path: String,
    pub route_method: String,
    pub route_handler: String,
    pub source_path: String,
    pub source_point: Point,
}

// TODO: temp
impl Display for DetectedRoute {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}: {}\n{}:{}\n{}",
            self.route_method,
            self.route_path,
            self.source_path,
            self.source_point,
            self.route_handler
        )
    }
}
