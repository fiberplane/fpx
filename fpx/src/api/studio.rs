// Allow unused imports since this will make it easier to work with the
// different features.
#![allow(unused_imports)]

use axum::extract::Request;
use axum::response::IntoResponse;
use http::StatusCode;

#[cfg(feature = "embed-studio")]
static STUDIO_DIST: include_dir::Dir<'_> =
    include_dir::include_dir!("$CARGO_MANIFEST_DIR/../frontend/dist");

/// A simple handler that serves the frontend Studio from STUDIO_DIST.
#[cfg(feature = "embed-studio")]
pub async fn default_handler(req: Request) -> impl IntoResponse {
    tracing::trace!(uri=?req.uri(), "Serving file from embedded Studio");

    let path = req.uri().path().trim_start_matches('/');

    // Retrieve the File that according to the path. If it is a directory, see
    // if there is an index.html file. Otherwise, always fallback to the
    // index.html in the root.
    let file = STUDIO_DIST
        .get_entry(path)
        .and_then(|entry| match entry {
            include_dir::DirEntry::Dir(dir_entry) => {
                dir_entry.get_file(dir_entry.path().join("index.html"))
            }
            include_dir::DirEntry::File(file_entry) => Some(file_entry),
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

/// The default handler when the feature `embed-studio` is not enabled.
///
/// For now this will simply return a 404.
#[cfg(not(feature = "embed-studio"))]
pub async fn default_handler() -> impl IntoResponse {
    StatusCode::NOT_FOUND.into_response()
}
