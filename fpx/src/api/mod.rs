use crate::events::EventsState;
use crate::types::ServerMessage;
use axum::response::Html;
use axum::routing::get;
use axum_tracing_opentelemetry::middleware::{OtelAxumLayer, OtelInResponseLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

mod handlers;
mod ws;

/// Create a API and expose it through a axum router.
pub async fn create_api(events: EventsState<ServerMessage>) -> axum::Router {
    let app = axum::Router::new()
        .route("/api/v1/logs", get(handlers::logs_handler))
        .route("/api/ws", get(ws::ws_handler))
        .route(
            "/",
            get(|| async {
                info!("test!");
                Html("Hello, world!")
            }),
        )
        // include trace context as header into the response
        .layer(OtelInResponseLayer::default())
        //start OpenTelemetry trace on incoming request
        .layer(OtelAxumLayer::default())
        .layer(TraceLayer::new_for_http())
        .with_state(events)
        .route("/health", get(handlers::health_handler));

    app
}
