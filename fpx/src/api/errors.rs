use axum::response::IntoResponse;
use bytes::Bytes;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiServerError<E> {
    /// An error occurred in the service. These errors are specific to the
    /// endpoint that was called.
    #[error(transparent)]
    ServiceError(E),

    #[error(transparent)]
    CommonError(CommonError),
}

impl<E> IntoResponse for ApiServerError<E>
where
    E: IntoResponse,
{
    fn into_response(self) -> axum::response::Response {
        match self {
            ApiServerError::ServiceError(err) => err.into_response(),
            ApiServerError::CommonError(err) => err.into_response(),
        }
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

#[derive(Debug, Error, Serialize, Deserialize)]
pub enum CommonError {
    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for CommonError {
    fn into_response(self) -> axum::response::Response {
        let body = serde_json::to_vec(&self).expect("Failed to serialize CommonError");
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}
