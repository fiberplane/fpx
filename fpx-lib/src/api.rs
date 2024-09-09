use crate::data::BoxedStore;
use crate::otel::OtelTraceLayer;
use crate::service::Service;
use axum::extract::FromRef;
use axum::routing::{get, post};
use http::StatusCode;
use tower_http::compression::CompressionLayer;
use tower_http::decompression::RequestDecompressionLayer;

pub mod errors;
pub mod handlers;
pub mod models;

#[derive(Clone)]
pub struct ApiState {
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

#[derive(Default)]
pub struct Builder {
    enable_compression: bool,
}

impl Builder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_compression(mut self, compression: bool) -> Self {
        self.enable_compression = compression;
        self
    }

    pub fn enable_compression(self) -> Self {
        self.set_compression(true)
    }

    /// Create a API and expose it through a axum router.
    pub fn build(self, service: Service, store: BoxedStore) -> axum::Router {
        let api_state = ApiState { service, store };

        let router = axum::Router::new()
            .route("/v1/traces", post(handlers::otel::trace_collector_handler))
            .route("/v1/traces", get(handlers::traces::traces_list_handler))
            .route(
                "/v1/traces/:trace_id",
                get(handlers::traces::traces_get_handler)
                    .delete(handlers::traces::traces_delete_handler),
            )
            .route(
                "/v1/traces/:trace_id/spans",
                get(handlers::spans::span_list_handler),
            )
            .route(
                "/v1/traces/:trace_id/spans/:span_id",
                get(handlers::spans::span_get_handler).delete(handlers::spans::span_delete_handler),
            )
            .with_state(api_state)
            .fallback(StatusCode::NOT_FOUND)
            .layer(OtelTraceLayer::default())
            .layer(RequestDecompressionLayer::new());

        if self.enable_compression {
            router.layer(CompressionLayer::new())
        } else {
            router
        }
    }
}
