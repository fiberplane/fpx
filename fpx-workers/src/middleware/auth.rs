use axum::{
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};

use tracing::debug;



pub async fn auth_middleware(
    request: Request<Body>,
    env: worker::Env,
    next: Next,
) -> Result<Response, StatusCode> {
    
    let expected_token = env.var("API_TOKEN").map_err(|_| {
        debug!("Failed to get API_TOKEN");
        StatusCode::INTERNAL_SERVER_ERROR
    })?.to_string();
    
    if expected_token.is_empty() {
        debug!("API_TOKEN is empty");
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }
    debug!("Expected token: {}", expected_token);

    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|header| header.to_str().ok());



    match auth_header {
        Some(auth) if auth.starts_with("Bearer ") => {
            let token = &auth[7..];
            debug!("Received token: {}", token);
            
            if token == expected_token {
                Ok(next.run(request).await)
            } else {
                Err(StatusCode::UNAUTHORIZED)
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
} 