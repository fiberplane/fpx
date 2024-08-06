use crate::ws::client::WebSocketWorkerClient;
use crate::ws::worker::BroadcastPayload;
use axum::body::Body;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use axum::Json;
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
            return WebSocketWorkerClient::new(state.env)
                .connect()
                .await
                .unwrap()
                .into();
        }
    }

    Response::builder()
        .status(StatusCode::UPGRADE_REQUIRED)
        .body(Body::from("Durable Object expected Upgrade: websocket"))
        .unwrap()
}

#[worker::send]
pub async fn ws_broadcast(
    State(state): State<WorkerApiState>,
    Json(payload): Json<BroadcastPayload>,
) -> Response<Body> {
    WebSocketWorkerClient::new(state.env)
        .broadcast(payload)
        .await
        .unwrap()
        .into()
}
