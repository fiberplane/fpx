use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::middleware::Next;
use axum::response::Response;

pub async fn auth_middleware(
    expected_token: String,
    request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // Retrieve the Authorization from the request. If we are not able to parse
    // the Header or it is missing, then the variable will be a empty &str.
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|header| header.to_str().ok())
        .unwrap_or("");

    // Split on the first space and make sure the first part matches 'Bearer'
    // and the second part matches the expected_token.
    match auth_header.split_once(' ') {
        Some(("Bearer", token)) if token == expected_token => Ok(next.run(request).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
