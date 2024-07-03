use anyhow::anyhow;
use axum::response::IntoResponse;
use bytes::Bytes;
use http::StatusCode;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;
use std::fmt::Formatter;
use std::ops::{Deref, DerefMut};
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

impl<E> From<E> for ApiServerError<E> {
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

impl IntoResponse for CommonError {
    fn into_response(self) -> axum::response::Response {
        let body = serde_json::to_vec(&self).expect("Failed to serialize CommonError");
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

#[derive(Debug)]
#[repr(transparent)]
/// Wrapper type for [`anyhow::Error`] which implements [`Serialize`] and [`Deserialize`]
pub struct AnyhowError(pub anyhow::Error);

impl fmt::Display for AnyhowError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for AnyhowError {
    fn default() -> Self {
        Self(anyhow!("error not supplied"))
    }
}

impl Serialize for AnyhowError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_unit()
    }
}

impl<'de> Deserialize<'de> for AnyhowError {
    fn deserialize<D>(_: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        Ok(Default::default())
    }
}

impl From<anyhow::Error> for AnyhowError {
    fn from(value: anyhow::Error) -> Self {
        Self(value)
    }
}

impl Deref for AnyhowError {
    type Target = anyhow::Error;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for AnyhowError {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl std::error::Error for AnyhowError {}

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
}
