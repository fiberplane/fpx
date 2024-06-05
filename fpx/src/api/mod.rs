use crate::events::EventsState;
use crate::types::ServerMessage;
use axum::response::Html;
use axum::routing::get;

mod handlers;
mod ws;

/// Create a API and expose it through a axum router.
pub async fn create_api(events: EventsState<ServerMessage>) -> axum::Router {
    axum::Router::new()
        .route("/api/v1/logs", get(handlers::logs_handler))
        .route("/api/ws", get(ws::ws_handler))
        .route("/", get(|| async { Html("Hello, world!") }))
        .with_state(events)
}
