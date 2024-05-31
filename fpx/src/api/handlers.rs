use crate::events::EventsState;
use crate::types::ServerMessage;
use axum::extract::State;
use axum::response::{Html, IntoResponse};
use tracing::info;

#[tracing::instrument(skip(events))]
pub async fn logs_handler(State(events): State<EventsState<ServerMessage>>) -> impl IntoResponse {
    events.broadcast(ServerMessage::Otel).await;

    Html("Hello, world!")
}

#[tracing::instrument()]
pub async fn health_handler() -> impl IntoResponse {
    info!("health check");

    Html("Ok")
}
