use super::ApiState;
use axum::extract::State;
use axum::response::IntoResponse;

mod inspect;
mod inspectors;
mod requestor;
mod requests;

// Re-export the all the handlers from different modules
pub use inspect::*;
pub use inspectors::*;
pub use requestor::*;
pub use requests::*;

#[tracing::instrument(skip_all)]
pub async fn logs_handler(State(ApiState { .. }): State<ApiState>) -> impl IntoResponse {
    // events.broadcast(ServerMessage::Otel);

    "Hello, World"
}
