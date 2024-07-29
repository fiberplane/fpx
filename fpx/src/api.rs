use crate::data::Store;
use crate::events::ServerEvents;
use crate::inspector::InspectorService;
use crate::otel_util::{HeaderMapExtractor, HeaderMapInjector};
use crate::service::Service;
use axum::extract::{FromRef, MatchedPath, Request};
use axum::response::Response;
use axum::routing::{any, get, post};
use futures_util::future::BoxFuture;
use http::StatusCode;
use opentelemetry::propagation::TextMapPropagator;
use std::path::PathBuf;
use tower::Layer;
use tracing::Instrument;
use tracing::{field, info_span, Span};
use tracing_opentelemetry::OpenTelemetrySpanExt;
use url::Url;

pub mod client;
pub mod errors;
pub mod handlers;
pub mod models;
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
    inspector_service: InspectorService,
    service: Service,
    store: Store,
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

impl FromRef<ApiState> for Service {
    fn from_ref(api_state: &ApiState) -> Service {
        api_state.service.clone()
    }
}

impl FromRef<ApiState> for Store {
    fn from_ref(api_state: &ApiState) -> Store {
        api_state.store.clone()
    }
}

/// Create a API and expose it through a axum router.
pub fn create_api(
    base_url: url::Url,
    fpx_directory: PathBuf,
    events: ServerEvents,
    inspector_service: InspectorService,
    service: Service,
    store: Store,
) -> axum::Router {
    let api_state = ApiState {
        config: Config {
            base_url,
            fpx_directory,
        },
        events,
        inspector_service,
        service,
        store,
    };
    let api_router = api_router();

    axum::Router::new()
        .route("/v1/traces", post(handlers::otel::trace_collector_handler))
        .nest("/api/", api_router)
        .with_state(api_state)
        .fallback(studio::default_handler)
}

fn api_router() -> axum::Router<ApiState> {
    axum::Router::new()
        .route(
            "/requests/:id",
            get(handlers::request_get_handler).delete(handlers::request_delete_handler),
        )
        .route("/requestor", post(handlers::execute_requestor))
        .route(
            "/inspectors",
            get(handlers::inspector_list_handler).post(handlers::inspector_create_handler),
        )
        .route("/inspect", any(handlers::inspect_request_handler))
        .route("/inspect/:id", any(handlers::inspect_request_handler))
        .route("/ws", get(ws::ws_handler))
        .route(
            "/traces/:trace_id/spans/:span_id",
            get(handlers::spans::span_get_handler),
        )
        .route(
            "/traces/:trace_id/spans",
            get(handlers::spans::span_list_handler),
        )
        .fallback(StatusCode::NOT_FOUND)
        .layer(OtelTraceLayer {})
}

/// This [`tower_layer::Layer`] will add OTEL specific tracing to the request.
#[derive(Clone)]
struct OtelTraceLayer {}

impl<S> Layer<S> for OtelTraceLayer {
    type Service = OtelTraceService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        OtelTraceService { inner }
    }
}

#[derive(Clone)]
struct OtelTraceService<S> {
    inner: S,
}

impl<S> tower::Service<Request> for OtelTraceService<S>
where
    S: tower::Service<Request, Response = Response> + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        let span = create_span_from_req(&req);
        let headers = req.headers();
        let extractor = HeaderMapExtractor(headers);

        let propagator = opentelemetry_sdk::propagation::TraceContextPropagator::new();
        let context = propagator.extract(&extractor);
        span.set_parent(context);

        let future = self.inner.call(req);
        Box::pin(
            async move {
                let mut response: Response = future.await?;

                let headers = response.headers_mut();
                let propagator = opentelemetry_sdk::propagation::TraceContextPropagator::new();

                let context = tracing::Span::current().context();
                let mut header_injector = HeaderMapInjector(headers);
                propagator.inject_context(&context, &mut header_injector);

                Ok(response)
            }
            .instrument(span),
        )
    }
}

fn create_span_from_req(req: &Request) -> Span {
    let path = if let Some(path) = req.extensions().get::<MatchedPath>() {
        path.as_str()
    } else {
        req.uri().path()
    };

    info_span!(
        "HTTP request",
        http.request.method = req.method().as_str(),
        url.path = req.uri().path(),
        url.query = req.uri().query(),
        url.scheme = ?req.uri().scheme(),
        otel.kind = "Server",
        otel.name = format!("{} {}", req.method().as_str(), path),
        otel.status_code = field::Empty, // Should be set on the response
    )
}
