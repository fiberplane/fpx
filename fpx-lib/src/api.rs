use crate::data::Store;
use crate::events::ServerEvents;
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
pub struct ApiState<S>
where
    S: Store + Clone,
{
    _events: ServerEvents,
    service: Service<S>,
    store: S,
}

// impl<S> FromRef<ApiState<S>> for S
// where
//     S: Store + Clone,
// {
//     fn from_ref(state: &ApiState<S>) -> Self {
//         state.store.clone()
//     }
// }

impl<S> FromRef<ApiState<S>> for Service<S>
where
    S: Store + Clone,
{
    fn from_ref(state: &ApiState<S>) -> Self {
        state.service.clone()
    }
}

/// Create a API and expose it through a axum router.
pub fn create_api<S>(events: ServerEvents, service: Service<S>, store: S) -> axum::Router
where
    S: Store + Clone + 'static,
{
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
        .with_state(api_state)
        .fallback(StatusCode::NOT_FOUND)
}
