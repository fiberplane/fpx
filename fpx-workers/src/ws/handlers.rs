use crate::ws::client::WebSocketWorkerClient;
use axum::body::Body;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use std::sync::Arc;
use worker::Env;

#[derive(Clone)]
pub struct WorkerApiState {
    pub env: Arc<Env>,
}

#[worker::send]
pub async fn ws_connect(State(state): State<WorkerApiState>, headers: HeaderMap) -> Response<Body> {
    if let Some(value) = headers.get("Upgrade") {
        if value == "websocket" {
            let connection = WebSocketWorkerClient::new(&state.env).connect().await;

            return match connection {
                Ok(response) => response.into(),
                Err(_) => Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(Body::from(
                        "An unexpected error occurred connecting to the Durable Object",
                    ))
                    .unwrap(),
            };
        }
    }

    Response::builder()
        .status(StatusCode::UPGRADE_REQUIRED)
        .body(Body::from("Durable Object expected Upgrade: websocket"))
        .unwrap()
}
