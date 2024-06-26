use crate::data::Store;
use crate::events::ServerEvents;
use crate::inspector::InspectorService;
use axum::extract::FromRef;
use axum::routing::{any, get, post};
use http::StatusCode;
use url::Url;

pub mod client;
mod errors;
pub mod handlers;
mod studio;
mod ws;

#[derive(Clone)]
pub struct ApiState {
    /// The base url on which this server is running. Override this when you
    /// are running this behind a reverse proxy.
    base_url: Url,

    events: ServerEvents,
    store: Store,
    inspector_service: InspectorService,
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

impl FromRef<ApiState> for InspectorService {
    fn from_ref(api_state: &ApiState) -> InspectorService {
        api_state.inspector_service.clone()
    }
}

/// Create a API and expose it through a axum router.
pub fn create_api(
    base_url: url::Url,
    events: ServerEvents,
    store: Store,
    inspector_service: InspectorService,
) -> axum::Router {
    let api_router = api_router(base_url, events, store, inspector_service);
    axum::Router::new()
        .nest("/api/", api_router)
        .fallback(studio::default_handler)
}

fn api_router(
    base_url: url::Url,
    events: ServerEvents,
    store: Store,
    inspector_service: InspectorService,
) -> axum::Router {
    let api_state = ApiState {
        base_url,
        events,
        store,
        inspector_service,
    };
    axum::Router::new()
        .route(
            "/requests/:id",
            get(handlers::request_get_handler).delete(handlers::request_delete_handler),
        )
        .route(
            "/inspectors",
            get(handlers::inspector_list_handler).post(handlers::inspector_create_handler),
        )
        .route("/inspect", any(handlers::inspect_request_handler))
        .route("/inspect/:id", any(handlers::inspect_request_handler))
        .route("/v1/logs", get(handlers::logs_handler))
        .route("/ws", get(ws::ws_handler))
        .route("/requestor", post(handlers::execute_requestor))
        .fallback(StatusCode::NOT_FOUND)
        .with_state(api_state)
}
