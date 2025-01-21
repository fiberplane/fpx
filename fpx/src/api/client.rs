//! API client for the FPX API.
//!
//! Eventually this should be moved into its own crate and not be part of the
//! api module. But for now this is only used within our own code, so it is
//! fine.

use super::errors::CommonError;
use super::handlers::spans::SpanGetError;
use super::handlers::traces::TraceGetError;
use super::models;
use crate::otel::HeaderMapInjector;
use anyhow::Result;
use bytes::Bytes;
use http::{HeaderMap, Method, StatusCode};
use opentelemetry::propagation::TextMapPropagator;
use opentelemetry_sdk::propagation::TraceContextPropagator;
use std::error::Error;
use std::future::Future;
use thiserror::Error;
use tracing::error;
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

#[allow(dead_code)]
#[derive(Debug, Error)]
pub enum ApiClientError<E> {
    /// This can only occur when a invalid base URL was provided.
    #[error("An invalid URL was provided: {0}")]
    ParseError(#[from] url::ParseError),

    /// An error occurred in reqwest.
    #[error("An error occurred while making the request: {0}")]
    ClientError(#[from] reqwest::Error),

    /// An error returned from the service. These errors are specific to the
    /// endpoint that was called.
    #[error(transparent)]
    ServiceError(E),

    #[error(transparent)]
    CommonError(#[from] CommonError),

    /// A response was received, but we were unable to deserialize it. The
    /// status code and the receive body are returned.
    #[error("API returned an unknown response: Status: {0}, Body: {1:?}")]
    InvalidResponse(StatusCode, Bytes),
}

impl<E> ApiClientError<E>
where
    E: serde::de::DeserializeOwned,
{
    /// Try to parse the result as a ServiceError or a CommonError. If both
    /// fail, return the status_code and body.
    pub fn from_response(status_code: StatusCode, body: Bytes) -> Self {
        // Try to parse the result as a ServiceError.
        if let Ok(result) = serde_json::from_slice::<E>(&body) {
            return ApiClientError::ServiceError(result);
        }

        // Try to parse the result as CommonError.
        if let Ok(result) = serde_json::from_slice::<CommonError>(&body) {
            return ApiClientError::CommonError(result);
        }

        // If both failed, return the status_code and the body for the user to
        // debug.
        ApiClientError::InvalidResponse(status_code, body)
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::errors::ApiServerError;
    use axum::response::IntoResponse;
    use fpx_macros::ApiError;
    use http::StatusCode;
    use http_body_util::BodyExt;
    use serde::{Deserialize, Serialize};
    use thiserror::Error;
    use tracing::error;

    #[derive(Debug, Serialize, Deserialize, Error, ApiError)]
    #[serde(tag = "error", content = "details", rename_all = "camelCase")]
    #[non_exhaustive]
    pub enum TestError {
        #[api_error(status_code = StatusCode::NOT_FOUND)]
        #[error("Request not found")]
        RequestNotFound,

        #[api_error(status_code = StatusCode::BAD_REQUEST)]
        #[error("Provided ID is invalid")]
        InvalidId,
    }

    /// Test to convert Service Error in a ApiServerError to a ApiClientError.
    #[tokio::test]
    async fn api_server_error_to_api_client_error_service_error() {
        let response = ApiServerError::ServiceError(TestError::RequestNotFound).into_response();

        let (parts, body) = response.into_parts();
        let body = body
            .collect()
            .await
            .expect("Should be able to read body")
            .to_bytes();

        let api_client_error = ApiClientError::from_response(parts.status, body);

        assert!(
            matches!(
                api_client_error,
                ApiClientError::ServiceError(TestError::RequestNotFound)
            ),
            "returned error does not match expected error; got: {:?}",
            api_client_error
        );
    }

    /// Test to convert Common Error in a ApiServerError to a ApiClientError.
    #[tokio::test]
    async fn api_server_error_to_api_client_error_common_error() {
        let response = ApiServerError::CommonError::<TestError>(CommonError::InternalServerError)
            .into_response();

        let (parts, body) = response.into_parts();
        let body = body
            .collect()
            .await
            .expect("Should be able to read body")
            .to_bytes();

        let api_client_error: ApiClientError<TestError> =
            ApiClientError::from_response(parts.status, body);

        assert!(
            matches!(
                api_client_error,
                ApiClientError::CommonError(CommonError::InternalServerError),
            ),
            "returned error does not match expected error; got: {:?}",
            api_client_error
        )
    }
}
