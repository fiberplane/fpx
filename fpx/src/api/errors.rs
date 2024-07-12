use axum::response::IntoResponse;
use bytes::Bytes;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::warn;

pub trait ApiError {
    fn status_code(&self) -> StatusCode;
}

#[derive(Debug, Error)]
pub enum ApiServerError<E> {
    /// An error occurred in the service. These errors are specific to the
    /// endpoint that was called.
    #[error(transparent)]
    ServiceError(E),

    #[error(transparent)]
    CommonError(CommonError),
}

/// An Implementation for `()` which always returns a 500 status code. This is
/// useful if an endpoint does not have any errors, but we still require it for
/// ApiServerError.
impl ApiError for () {
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

/// Blanket implementation for all types that implement `ApiError` and
/// `Serialize`. This should be the only implementation for `IntoResponse` that
/// we will use, since it adheres to our error handling strategy and only
/// requires implementing the `ApiError` trait (the `Serialize` trait is a
/// noop).
impl<E> IntoResponse for ApiServerError<E>
where
    E: ApiError,
    E: Serialize,
{
    fn into_response(self) -> axum::response::Response {
        let body = match &self {
            ApiServerError::ServiceError(err) => {
                serde_json::to_vec(err).expect("Failed to serialize ServiceError")
            }
            ApiServerError::CommonError(err) => {
                serde_json::to_vec(err).expect("Failed to serialize CommonError")
            }
        };

        let status_code = match &self {
            ApiServerError::ServiceError(err) => err.status_code(),
            ApiServerError::CommonError(err) => err.status_code(),
        };

        (status_code, body).into_response()
    }
}

/// Implementation for any anyhow::Error to be converted to a
/// `ApiServerError::InternalServerError`.
impl<E> From<anyhow::Error> for ApiServerError<E> {
    fn from(err: anyhow::Error) -> Self {
        warn!(?err, "An anyhow error was converted to a ApiServerError");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

/// Implementation for any ApiError to be converted to a
/// `ApiServerError::ServiceError`. This does not apply to _all_ types since
/// that would conflict with the impl for `anyhow::Error`.
impl<E> From<E> for ApiServerError<E>
where
    E: ApiError,
{
    fn from(value: E) -> Self {
        ApiServerError::ServiceError(value)
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

#[derive(Debug, Error, Serialize, Deserialize)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
pub enum CommonError {
    #[error("Internal server error")]
    InternalServerError,
}

impl ApiError for CommonError {
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::handlers::RequestGetError;
    use http_body_util::BodyExt;

    /// Test to convert Service Error in a ApiServerError to a ApiClientError.
    #[tokio::test]
    async fn api_server_error_to_api_client_error_service_error() {
        let response =
            ApiServerError::ServiceError(RequestGetError::RequestNotFound).into_response();

        let (parts, body) = response.into_parts();
        let body = body
            .collect()
            .await
            .expect("Should be able to read body")
            .to_bytes();

        let api_client_error = ApiClientError::from_response(parts.status, body);

        match api_client_error {
            ApiClientError::ServiceError(err) => match err {
                RequestGetError::RequestNotFound => (),
                err => panic!("Unexpected service error: {:?}", err),
            },
            err => panic!("Unexpected error: {:?}", err),
        }
    }

    /// Test to convert Common Error in a ApiServerError to a ApiClientError.
    #[tokio::test]
    async fn api_server_error_to_api_client_error_common_error() {
        let response =
            ApiServerError::CommonError::<RequestGetError>(CommonError::InternalServerError)
                .into_response();

        let (parts, body) = response.into_parts();
        let body = body
            .collect()
            .await
            .expect("Should be able to read body")
            .to_bytes();

        let api_client_error: ApiClientError<RequestGetError> =
            ApiClientError::from_response(parts.status, body);

        match api_client_error {
            ApiClientError::CommonError(err) => match err {
                CommonError::InternalServerError => (),
                err => panic!("Unexpected common error: {:?}", err),
            },
            err => panic!("Unexpected error: {:?}", err),
        }
    }

    /// Test to confirm that a anyhow::Error can be converted into a
    /// ApiServerError.
    #[tokio::test]
    async fn anyhow_error_into_api_server_error() {
        let anyhow_error = anyhow::Error::msg("some random anyhow error");
        let api_server_error: ApiServerError<()> = anyhow_error.into();

        match api_server_error {
            ApiServerError::CommonError(err) => match err {
                CommonError::InternalServerError => (),
                err => panic!("Unexpected common error: {:?}", err),
            },
            err => panic!("Unexpected error: {:?}", err),
        };
    }
}
