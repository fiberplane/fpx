use crate::ws::{client::WebSocketWorkerClient, worker::BroadcastPayload};
use axum::{
    body::Body,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use std::sync::Arc;
use worker::Env;

#[derive(Clone)]
pub struct WorkerApiState {
    pub env: Arc<Env>,
}

#[axum::debug_handler]
#[worker::send]
pub async fn ws_connect(
    State(state): State<WorkerApiState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(value) = headers.get("Upgrade") {
        if value == "websocket" {
            let res: Response<_> = WebSocketWorkerClient::new(state.env).connect().await.into();

            return res;
        }
    }

    Response::builder()
        .status(StatusCode::UPGRADE_REQUIRED)
        .body(Body::from("Durable Object expected Upgrade: websocket"))
        .unwrap()
}

#[axum::debug_handler]
#[worker::send]
pub async fn ws_broadcast(
    State(state): State<WorkerApiState>,
    Json(payload): Json<BroadcastPayload>,
) -> impl IntoResponse {
    let res: Response<_> = WebSocketWorkerClient::new(state.env)
        .broadcast(payload)
        .await
        .into();

    return res;
}
