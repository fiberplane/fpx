use axum::extract::{MatchedPath, Request};
use axum::response::Response;
use futures_util::future::BoxFuture;
use http::{HeaderMap, HeaderName, HeaderValue};
use opentelemetry::propagation::{Extractor, Injector, TextMapPropagator};
use opentelemetry_sdk::propagation::TraceContextPropagator;
use std::str::FromStr;
use tower::Layer;
use tracing::{field, info_span, Instrument, Span};
use tracing_opentelemetry::OpenTelemetrySpanExt;

/// The [`HeaderMapInjector`] provides a implementation for the otel
/// [`Injector`] trait on the [`HeaderMap`] type.
///
/// This allows a otel propagator to inject the span context into a
/// [`HeaderMap`], ie into a outgoing http response. Invalid keys or values,
/// according to http header standards, are silently ignored.
pub struct HeaderMapInjector<'a>(pub &'a mut HeaderMap);

impl<'a> Injector for HeaderMapInjector<'a> {
    fn set(&mut self, key: &str, val: String) {
        if let Ok(key) = HeaderName::from_str(key) {
            if let Ok(val) = HeaderValue::from_str(&val) {
                self.0.insert(key, val);
            }
        }
    }
}

/// The [`HeaderMapExtractor`] provides a implementation for the otel
/// [`Extractor`] trait on the [`HeaderMap`] type.
///
/// This allows a otel propagator to extract a span context from a [`HeaderMap`],
/// ie from a incoming http request.
pub struct HeaderMapExtractor<'a>(pub &'a HeaderMap);

impl<'a> Extractor for HeaderMapExtractor<'a> {
    fn get(&self, key: &str) -> Option<&str> {
        self.0.get(key).and_then(|val| val.to_str().ok())
    }

    fn keys(&self) -> Vec<&str> {
        self.0
            .keys()
            .map(|header_name| header_name.as_str())
            .collect::<Vec<_>>()
    }
}

/// [`tower_layer::Layer`] will add OTEL specific tracing to the request using
/// the [`OtelTraceService`].
#[derive(Clone, Default)]
pub struct OtelTraceLayer {}

impl<S> Layer<S> for OtelTraceLayer {
    type Service = OtelTraceService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        OtelTraceService { inner }
    }
}

/// The [`OtelTraceService`] will create a new otel span for each request.
///
/// On any request this will create a new span with some of the http/url
/// attributes as defined by the OTEL spec. Note this is a minimal
/// implementation at the moment. This span will use any context from the
/// incoming request (as defined by the tracecontext spec) as the parent span.
///
/// It will also encode the span context into the response headers.
#[derive(Clone)]
pub struct OtelTraceService<S> {
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
        let propagator = TraceContextPropagator::new();

        let span = create_span_from_req(&req);
        let headers = req.headers();
        let extractor = HeaderMapExtractor(headers);

        let context = propagator.extract(&extractor);
        span.set_parent(context);

        let future = self.inner.call(req);
        Box::pin(
            async move {
                let mut response: Response = future.await?;

                let headers = response.headers_mut();

                let context = tracing::Span::current().context();
                let mut header_injector = HeaderMapInjector(headers);
                propagator.inject_context(&context, &mut header_injector);

                Ok(response)
            }
            .instrument(span),
        )
    }
}

/// Create a new span for the incoming request. This uses conventions from the
/// point of view of a server (ie. the SpanKind is server and will use the
/// MatchedPath).
///
/// Note that this will only set a minimal set of attributes on the span.
fn create_span_from_req(req: &Request) -> Span {
    // Try to get the matched path from the request. This ia a extenion from
    // Axum, so it might not be present. Fallback on the actual path if it
    // isn't present.
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
