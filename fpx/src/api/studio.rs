use axum::extract::Request;
use axum::response::IntoResponse;
use http::StatusCode;
use include_dir::{include_dir, Dir, DirEntry, File};
use tracing::trace;

static STUDIO_DIST: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../frontend/dist");

/// A simple handler that serves the frontend Studio from STUDIO_DIST.
pub async fn default_handler(req: Request) -> impl IntoResponse {
    trace!(uri=?req.uri(), "Serving file from embedded Studio");

    let path = req.uri().path().trim_start_matches('/');

    // Retrieve the File that according to the path. If it is a directory, see
    // if there is an index.html file. Otherwise, always fallback to the
    // index.html in the root.
    let file: Option<&File> = STUDIO_DIST
        .get_entry(path)
        .and_then(|entry| match entry {
            DirEntry::Dir(dir_entry) => dir_entry.get_file(dir_entry.path().join("index.html")),
            DirEntry::File(file_entry) => Some(file_entry),
        })
        .or_else(|| STUDIO_DIST.get_file("index.html"));

    // If nothing matches _at all_, then return a 404.
    let Some(file) = file else {
        return StatusCode::NOT_FOUND.into_response();
    };

    let content = file.contents();

    // Naive content type detection
    let content_type = match file.path().extension().and_then(|ext| ext.to_str()) {
        Some("html") => "text/html",
        Some("css") => "text/css",
        Some("js") => "text/javascript",
        Some("ico") => "image/x-icon",
        _ => "text/plain",
    };

    (
        StatusCode::OK,
        [(http::header::CONTENT_TYPE, content_type)],
        content,
    )
        .into_response()
}
