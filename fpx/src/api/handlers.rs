use crate::events::EventsState;
use crate::types::ServerMessage;
use axum::extract::State;
use axum::response::Html;
use axum::response::IntoResponse;

pub async fn logs_handler(State(events): State<EventsState<ServerMessage>>) -> impl IntoResponse {
    events.broadcast(ServerMessage::Otel);

    Html("Hello, world!")
}
