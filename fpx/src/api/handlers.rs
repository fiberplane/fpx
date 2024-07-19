use axum::response::IntoResponse;

pub(crate) mod canned_requests;
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
pub async fn logs_handler() -> impl IntoResponse {
    "Hello, World"
}
