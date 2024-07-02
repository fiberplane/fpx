use crate::data::Store;
use crate::events::ServerEvents;
use crate::inspector::InspectorService;
use axum::extract::FromRef;
use axum::routing::{any, get};
use http::StatusCode;
use std::path::PathBuf;
use url::Url;

pub mod client;
mod errors;
pub mod handlers;
mod studio;
mod ws;

#[derive(Clone)]
#[allow(dead_code)]
pub struct Config {
    /// The base url on which this server is running. Override this when you
    /// are running this behind a reverse proxy.
    base_url: Url,

    /// the location of the fpx directory
    fpx_directory: PathBuf,
}

#[derive(Clone)]
pub struct ApiState {
    config: Config,
    events: ServerEvents,
    store: Store,
    inspector_service: InspectorService,
}

impl FromRef<ApiState> for Store {
    fn from_ref(api_state: &ApiState) -> Self {
        api_state.store.clone()
    }
}

impl FromRef<ApiState> for ServerEvents {
    fn from_ref(api_state: &ApiState) -> Self {
        api_state.events.clone()
    }
}

impl FromRef<ApiState> for InspectorService {
    fn from_ref(api_state: &ApiState) -> Self {
        api_state.inspector_service.clone()
    }
}

impl FromRef<ApiState> for Config {
    fn from_ref(api_state: &ApiState) -> Self {
        api_state.config.clone()
    }
}

/// Create a API and expose it through a axum router.
pub fn create_api(
    base_url: url::Url,
    fpx_directory: PathBuf,
    events: ServerEvents,
    store: Store,
    inspector_service: InspectorService,
) -> axum::Router {
    let api_router = api_router(base_url, fpx_directory, events, store, inspector_service);
    axum::Router::new()
        .nest("/api/", api_router)
        .fallback(studio::default_handler)
}

fn api_router(
    base_url: Url,
    fpx_directory: PathBuf,
    events: ServerEvents,
    store: Store,
    inspector_service: InspectorService,
) -> axum::Router {
    let api_state = ApiState {
        config: Config {
            base_url,
            fpx_directory,
        },
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
        .fallback(StatusCode::NOT_FOUND)
        .with_state(api_state)
}
