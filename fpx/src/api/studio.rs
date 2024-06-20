use axum::extract::Request;
use axum::response::{IntoResponse, Response};
use http::StatusCode;
use include_dir::{include_dir, Dir, DirEntry};

static STUDIO_DIST: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../frontend/dist");

pub async fn default_handler(req: Request) -> Response {
    // check if it is a file, if so return the file
    // if it is a directory, return the index.html file
    // otherwise _always_ fallback index.html

    let path = req.uri().path().trim_start_matches('/');

    if let Some(entry) = STUDIO_DIST.get_entry(path) {
        match entry {
            DirEntry::Dir(dir_entry) => {
                let index_html = dir_entry
                    .get_file("index.html")
                    .expect("index.html should exist in the dist directory")
                    .contents_utf8()
                    .unwrap();

                return (
                    StatusCode::OK,
                    [(http::header::CONTENT_TYPE, "text/html")],
                    index_html,
                )
                    .into_response();
            }
            DirEntry::File(file_entry) => {
                let content = file_entry.contents_utf8().unwrap();
                let content_type =
                    // some naive content type detection
                    match file_entry.path().extension().and_then(|ext| ext.to_str()) {
                        Some("html") => "text/html",
                        Some("css") => "text/css",
                        Some("js") => "text/javascript",
                        Some("ico") => "image/x-icon",
                        _ => "text/plain",
                    };

                return (
                    StatusCode::OK,
                    [(http::header::CONTENT_TYPE, content_type)],
                    content,
                )
                    .into_response();
            }
        };
    };

    (
        StatusCode::OK,
        [(http::header::CONTENT_TYPE, "text/html")],
        STUDIO_DIST
            .get_file("index.html")
            .expect("index.html should exist in the dist directory")
            .contents_utf8()
            .unwrap(),
    )
        .into_response()
}
