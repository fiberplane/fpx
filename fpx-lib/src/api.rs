use crate::data::{BoxedEvents, BoxedStore};
use crate::otel::OtelTraceLayer;
use crate::service::Service;
use axum::extract::FromRef;
use axum::routing::{get, post};
use http::StatusCode;
use std::path::PathBuf;
use url::Url;

pub mod errors;
pub mod handlers;
pub mod models;

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
    _events: BoxedEvents,
    service: Service,
    store: BoxedStore,
}

impl FromRef<ApiState> for BoxedStore {
    fn from_ref(state: &ApiState) -> Self {
        state.store.clone()
    }
}

impl FromRef<ApiState> for Service {
    fn from_ref(state: &ApiState) -> Self {
        state.service.clone()
    }
}

/// Create a API and expose it through a axum router.
pub fn create_api(events: BoxedEvents, service: Service, store: BoxedStore) -> axum::Router {
    let api_state = ApiState {
        _events: events,
        service,
        store,
    };

    axum::Router::new()
        .route("/v1/traces", post(handlers::otel::trace_collector_handler))
        .route(
            "/api/traces/:trace_id/spans/:span_id",
            get(handlers::spans::span_get_handler),
        )
        .route(
            "/api/traces/:trace_id/spans",
            get(handlers::spans::span_list_handler),
        )
        .route(
            "/api/traces/:trace_id",
            get(handlers::traces::traces_get_handler),
        )
        .route("/api/traces", get(handlers::traces::traces_list_handler))
        .layer(OtelTraceLayer::default())
        .with_state(api_state)
        .fallback(StatusCode::NOT_FOUND)
}
