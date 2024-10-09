use crate::api::handlers::routes::{route_create, route_delete, route_get, route_probe};
use crate::data::BoxedStore;
use crate::otel::OtelTraceLayer;
use crate::service::Service;
use axum::extract::FromRef;
use axum::routing::{delete, get, post};
use http::StatusCode;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
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
    allow_origin_any: bool,
    enable_compression: bool,
}

impl Builder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn allow_origin_any(mut self) -> Self {
        self.allow_origin_any = true;
        self
    }

    pub fn set_compression(mut self, compression: bool) -> Self {
        self.enable_compression = compression;
        self
    }

    pub fn enable_compression(self) -> Self {
        self.set_compression(true)
    }

    /// Create an API and expose it through an axum router.
    pub fn build(self, service: Service, store: BoxedStore) -> axum::Router {
        let api_state = ApiState { service, store };

        let mut router = axum::Router::new()
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
            .route(
                "/v0/settings",
                get(handlers::settings::settings_get).post(handlers::settings::settings_upsert),
            )
            .route("/v0/probed-routes", post(route_probe))
            .route("/v0/app-routes", get(route_get).post(route_create))
            .route("/v0/app-routes/:method/:path", delete(route_delete))
            .with_state(api_state)
            .fallback(StatusCode::NOT_FOUND)
            .layer(OtelTraceLayer::default())
            .layer(RequestDecompressionLayer::new());

        if self.allow_origin_any {
            router = router.layer(CorsLayer::new().allow_origin(Any));
        }

        if self.enable_compression {
            router = router.layer(CompressionLayer::new());
        }

        router
    }
}
