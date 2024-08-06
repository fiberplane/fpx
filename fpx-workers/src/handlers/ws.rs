use axum::{http::HeaderMap, response::IntoResponse};
use std::sync::Arc;
use worker::{Env, Stub};

use crate::ws::BroadcastPayload;

use super::WorkerApiState;

#[axum::debug_handler]
#[worker::send]
pub async fn ws_connect(
    axum::extract::State(state): axum::extract::State<WorkerApiState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(value) = headers.get("Upgrade") {
        if value == "websocket" {
            let mut req =
                worker::Request::new("http://fake-host/connect", worker::Method::Get).unwrap();

            req.headers_mut()
                .unwrap()
                .set("Upgrade", "websocket")
                .unwrap();

            let res: axum::http::Response<_> = get_ws_server(state.env)
                .unwrap()
                .fetch_with_request(req)
                .await
                .unwrap()
                .into();

            return res;
        }
    }

    axum::http::Response::builder()
        .status(axum::http::StatusCode::UPGRADE_REQUIRED)
        .body(axum::body::Body::from(
            "Durable Object expected Upgrade: websocket",
        ))
        .unwrap()
}

#[axum::debug_handler]
#[worker::send]
pub async fn ws_broadcast(
    axum::extract::State(state): axum::extract::State<WorkerApiState>,
    axum::extract::Json(payload): axum::extract::Json<BroadcastPayload>,
) -> impl IntoResponse {
    let payload = serde_json::to_string(&payload).unwrap();

    let req = axum::http::Request::builder()
        .uri("http://fake-host/broadcast")
        .method("POST")
        .body(payload)
        .unwrap();

    let req = worker::Request::try_from(req).unwrap();

    let res: axum::response::Response = get_ws_server(state.env)
        .unwrap()
        .fetch_with_request(req)
        .await
        .unwrap()
        .into();

    res
}

fn get_ws_server(env: Arc<Env>) -> Result<Stub, worker::Error> {
    let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
    let stub = ws.id_from_name("ws")?.get_stub()?;

    Ok(stub)
}
