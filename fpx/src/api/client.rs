//! API client for the FPX API.
//!
//! Eventually this should be moved into its own crate and not be part of the
//! api module. But for now this is only used within our own code, so it is
//! fine.

use super::errors::ApiClientError;
use anyhow::Result;
use fpx_lib::api::handlers::spans::SpanGetError;
use fpx_lib::api::handlers::traces::TraceGetError;
use fpx_lib::api::models;
use fpx_lib::otel::HeaderMapInjector;
use http::{HeaderMap, Method};
use opentelemetry::propagation::TextMapPropagator;
use opentelemetry_sdk::propagation::TraceContextPropagator;
use std::error::Error;
use tracing::trace;
use tracing_opentelemetry::OpenTelemetrySpanExt;
use url::Url;

pub struct ApiClient {
    client: reqwest::Client,
    base_url: Url,
}

impl ApiClient {
    /// Create a new ApiClient with a default [`reqwest::Client`].
    ///
    /// [`base_url`] should be the host of the fpx API, with optionally a port
    /// and a path (in case you are doing path based routing).
    pub fn new(base_url: Url) -> Self {
        let version = env!("CARGO_PKG_VERSION");
        let client = reqwest::Client::builder()
            .user_agent(format!("fpx/{version}"))
            .build()
            .expect("should be able to create reqwest client");

        Self::with_client(client, base_url)
    }

    /// Create a new ApiClient with a custom [`reqwest::Client`].
    pub fn with_client(client: reqwest::Client, base_url: Url) -> Self {
        Self { client, base_url }
    }

    /// Perform a request using fpx API's convention.
    ///
    /// This means that it will try to parse the response as [`T`]. If that
    /// fails it will consider the call as failed and will try to parse the body
    /// as [`E`]. Any other error will use the relevant variant in
    /// [`ApiClientError`].
    #[tracing::instrument(skip_all, fields(otel.kind="Client",otel.status_code, otel.status_message))]
    async fn do_req<T, E, B>(
        &self,
        method: Method,
        path: impl AsRef<str>,
        body: Option<B>,
    ) -> Result<T, ApiClientError<E>>
    where
        T: serde::de::DeserializeOwned,
        E: serde::de::DeserializeOwned + Error,
        B: serde::ser::Serialize,
    {
        let u = self.base_url.join(path.as_ref())?;

        let mut req = self.client.request(method, u);

        if let Some(body) = body {
            let json = serde_json::to_string(&body).unwrap();

            req = req.header("Content-Type", "application/json").body(json);
        }

        // Take the current otel context, and inject those details into the
        // Request using the TraceContext format.
        let req = {
            let mut headers = HeaderMap::new();
            let propagator = TraceContextPropagator::new();

            let context = tracing::Span::current().context();
            let mut header_injector = HeaderMapInjector(&mut headers);
            propagator.inject_context(&context, &mut header_injector);

            req.headers(headers)
        };

        // TODO: Create new otel span (SpanKind::Client) and add relevant client
        // attributes to it.

        // Make request
        let response = req.send().await?;

        // Copy the status code here in case we are unable to parse the response as
        // the Ok or Err variant.
        let status_code = response.status();

        // Read the entire response into a local buffer.
        let body = response.bytes().await?;

        // TODO: Mark the span status as Err if we are unable to parse the
        // response.

        // Try to parse the result as T.
        match serde_json::from_slice::<T>(&body) {
            Ok(result) => {
                tracing::Span::current().record("otel.status_code", "Ok");
                Ok(result)
            }
            Err(err) => {
                trace!(
                    ?status_code,
                    ?err,
                    "Failed to parse response as expected type"
                );
                let err = ApiClientError::from_response(status_code, body);
                tracing::Span::current().record("otel.status_code", "Err");
                tracing::Span::current().record("otel.status_message", err.to_string());
                Err(err)
            }
        }
    }

    /// Retrieve the details of a single span.
    pub async fn span_get(
        &self,
        trace_id: impl AsRef<str>,
        span_id: impl AsRef<str>,
    ) -> Result<models::Span, ApiClientError<SpanGetError>> {
        let path = format!(
            "api/traces/{}/spans/{}",
            trace_id.as_ref(),
            span_id.as_ref()
        );

        self.do_req(Method::GET, path, None::<()>).await
    }

    /// Retrieve all the spans associated with a single trace.
    pub async fn span_list(
        &self,
        trace_id: impl AsRef<str>,
    ) -> Result<Vec<models::Span>, ApiClientError<SpanGetError>> {
        let path = format!("api/traces/{}/spans", trace_id.as_ref());

        self.do_req(Method::GET, path, None::<()>).await
    }

    /// Retrieve a summary of a single trace.
    pub async fn trace_get(
        &self,
        trace_id: impl AsRef<str>,
    ) -> Result<models::TraceSummary, ApiClientError<TraceGetError>> {
        let path = format!("api/traces/{}", trace_id.as_ref());

        self.do_req(Method::GET, path, None::<()>).await
    }

    /// List a summary traces
    pub async fn trace_list(
        &self,
    ) -> Result<Vec<models::TraceSummary>, ApiClientError<TraceGetError>> {
        let path = "api/traces";

        self.do_req(Method::GET, path, None::<()>).await
    }
}
