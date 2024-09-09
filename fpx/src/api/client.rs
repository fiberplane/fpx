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
use http::{HeaderMap, Method, StatusCode};
use opentelemetry::propagation::TextMapPropagator;
use opentelemetry_sdk::propagation::TraceContextPropagator;
use std::error::Error;
use std::future::Future;
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
    #[tracing::instrument(skip_all, fields(otel.kind="Client", otel.status_code, otel.status_message))]
    async fn do_req<T, E, P>(
        &self,
        method: Method,
        path: impl AsRef<str>,
        response_parser: impl FnOnce(reqwest::Response) -> P,
    ) -> Result<T, ApiClientError<E>>
    where
        E: Error,
        P: Future<Output = Result<T, ApiClientError<E>>>,
    {
        let u = self.base_url.join(path.as_ref())?;

        let req = self.client.request(method, u);

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

        // Send the request
        let response = req.send().await?;

        // TODO: Retrieve all kinds of interesting details of the response and
        // set them in the OTEL trace:
        // - http.request.method
        // - server.address
        // - server.port
        // - url.full
        // - user_agent.original
        // - url.scheme
        // - url.template
        // - http.response.status_code
        // # Not sure if this is possible since we need to specify all fields upfront:
        // - http.request.header.<key>
        // - http.response.header.<key>

        // Parse the response according to the response_parser.
        let result = response_parser(response).await;

        // Set the status_code and status_message in the current OTEL span,
        // according to the result of the response_parser.
        if let Err(ref err) = &result {
            tracing::Span::current().record("otel.status_code", "Err");
            tracing::Span::current().record("otel.status_message", err.to_string());
        } else {
            tracing::Span::current().record("otel.status_code", "Ok");
        }

        result
    }

    /// Retrieve the details of a single span.
    pub async fn span_get(
        &self,
        trace_id: impl AsRef<str>,
        span_id: impl AsRef<str>,
    ) -> Result<models::Span, ApiClientError<SpanGetError>> {
        let path = format!("v1/traces/{}/spans/{}", trace_id.as_ref(), span_id.as_ref());

        self.do_req(Method::GET, path, api_result).await
    }

    /// Retrieve all the spans associated with a single trace.
    pub async fn span_list(
        &self,
        trace_id: impl AsRef<str>,
    ) -> Result<Vec<models::Span>, ApiClientError<SpanGetError>> {
        let path = format!("v1/traces/{}/spans", trace_id.as_ref());

        self.do_req(Method::GET, path, api_result).await
    }

    /// Retrieve a summary of a single trace.
    pub async fn trace_get(
        &self,
        trace_id: impl AsRef<str>,
    ) -> Result<models::TraceSummary, ApiClientError<TraceGetError>> {
        let path = format!("v1/traces/{}", trace_id.as_ref());

        self.do_req(Method::GET, path, api_result).await
    }

    /// List a summary traces
    pub async fn trace_list(
        &self,
    ) -> Result<Vec<models::TraceSummary>, ApiClientError<TraceGetError>> {
        let path = "v1/traces";

        self.do_req(Method::GET, path, api_result).await
    }

    /// List a summary traces
    pub async fn trace_delete(
        &self,
        trace_id: impl AsRef<str>,
    ) -> Result<(), ApiClientError<TraceGetError>> {
        let path = format!("v1/traces/{}", trace_id.as_ref());

        self.do_req(Method::DELETE, path, no_body).await
    }

    pub async fn span_delete(
        &self,
        trace_id: impl AsRef<str>,
        span_id: impl AsRef<str>,
    ) -> Result<(), ApiClientError<TraceGetError>> {
        let path = format!("v1/traces/{}/spans/{}", trace_id.as_ref(), span_id.as_ref());

        self.do_req(Method::DELETE, path, no_body).await
    }
}

/// Check whether the response is a 204 No Content response, if it is return
/// Ok(()). Otherwise try to parse the response as a ApiError.
async fn no_body<E>(response: reqwest::Response) -> Result<(), ApiClientError<E>>
where
    E: serde::de::DeserializeOwned + Error,
{
    if response.status() == StatusCode::NO_CONTENT {
        return Ok(());
    }

    Err(ApiClientError::from_response(
        response.status(),
        response.bytes().await?,
    ))
}

/// Try to parse the result as T. If that fails, try to parse the result as a
/// ApiError.
async fn api_result<T, E>(response: reqwest::Response) -> Result<T, ApiClientError<E>>
where
    T: serde::de::DeserializeOwned,
    E: serde::de::DeserializeOwned + Error,
{
    // Copy the status code here in case we are unable to parse the response as
    // the Ok or Err variant.
    let status_code = response.status();

    // Read the entire response into a local buffer.
    let body = response.bytes().await?;

    // Try to parse the result as T.
    match serde_json::from_slice::<T>(&body) {
        Ok(result) => Ok(result),
        Err(err) => {
            trace!(
                ?status_code,
                ?err,
                "Failed to parse response as expected type"
            );
            Err(ApiClientError::from_response(status_code, body))
        }
    }
}
