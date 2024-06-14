use crate::data::store::Store;
use crate::events::ServerEvents;
use crate::inspector::InspectorService;
use axum::extract::FromRef;
use axum::response::Html;
use axum::routing::{any, get};
use std::sync::Arc;
use url::Url;

mod handlers;
pub mod types;
mod ws;

#[derive(Clone)]
pub struct ApiState {
    /// The base url on which this server is running. Override this when you
    /// are running this behind a reverse proxy.
    base_url: Url,

    events: ServerEvents,
    store: Store,
    inspector_service: Arc<InspectorService>,
}

impl FromRef<ApiState> for Store {
    fn from_ref(api_state: &ApiState) -> Store {
        api_state.store.clone()
    }
}

impl FromRef<ApiState> for ServerEvents {
    fn from_ref(api_state: &ApiState) -> ServerEvents {
        api_state.events.clone()
    }
}

impl FromRef<ApiState> for Arc<InspectorService> {
    fn from_ref(api_state: &ApiState) -> Arc<InspectorService> {
        api_state.inspector_service.clone()
    }
}

/// Create a API and expose it through a axum router.
pub async fn create_api(
    base_url: url::Url,
    events: ServerEvents,
    store: Store,
    inspector_service: Arc<InspectorService>,
) -> axum::Router {
    let api_state = ApiState {
        base_url,
        events,
        store,
        inspector_service,
    };

    axum::Router::new()
        .route(
            "/api/requests/:id",
            get(handlers::request_get_handler).delete(handlers::request_delete_handler),
        )
        .route(
            "/api/inspectors",
            get(handlers::inspector_list_handler).post(handlers::inspector_create_handler),
        )
        .route("/api/inspect", any(handlers::inspect_request_handler))
        .route("/api/inspect/:id", any(handlers::inspect_request_handler))
        .route("/api/v1/logs", get(handlers::logs_handler))
        .route("/api/ws", get(ws::ws_handler))
        .route("/", get(|| async { Html("Hello, world!") }))
        .with_state(api_state)
}
