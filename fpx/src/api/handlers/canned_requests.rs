use crate::api::errors::{AnyhowError, ApiServerError};
use crate::api::Config;
use crate::canned_requests::{CannedRequest, SaveLocation};
use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::Json;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use thiserror::Error;
use tracing::{error, instrument};

#[instrument(skip(config))]
pub async fn canned_request_create(
    State(config): State<Config>,
    Json(mut canned_request): Json<NewCannedRequest>,
) -> Result<StatusCode, ApiServerError<CannedRequestCreateError>> {
    let save_location = SaveLocation::try_parse(&canned_request.type_, config.fpx_directory)
        .map_err(|_| CannedRequestCreateError::InvalidType)?;

    canned_request.request.name = canned_request.name;
    canned_request
        .request
        .save(save_location)
        .await
        .map_err(|err| CannedRequestCreateError::Internal(err.into()))?;

    Ok(StatusCode::CREATED)
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct NewCannedRequest {
    #[serde(rename = "type")]
    type_: String,
    name: String,
    request: CannedRequest,
}

#[derive(Debug, Error, Serialize, Deserialize)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
#[allow(dead_code)]
pub enum CannedRequestCreateError {
    #[error("unknown type, expected `ephemeral`, `personal` or `shared`")]
    InvalidType,

    #[error("failed to handle request: {0:?}")]
    Internal(
        #[serde(skip, default)]
        #[from]
        AnyhowError,
    ),
}

impl IntoResponse for CannedRequestCreateError {
    fn into_response(self) -> Response {
        error!(error = ?self, "error occurred while creating canned request");

        let body = serde_json::to_vec(&self)
            .expect("Failed to serialize CannedRequestCreateError, should not happen");

        let status_code = match self {
            CannedRequestCreateError::InvalidType => StatusCode::BAD_REQUEST,
            CannedRequestCreateError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status_code, body).into_response()
    }
}

#[instrument(skip(config))]
pub async fn canned_request_list(
    State(config): State<Config>,
) -> Result<Json<BTreeMap<String, Vec<CannedRequest>>>, CannedRequestListError> {
    let map = BTreeMap::from([
        (
            "ephemeral".to_string(),
            CannedRequest::load_all(SaveLocation::Ephemeral).await?,
        ),
        (
            "personal".to_string(),
            CannedRequest::load_all(SaveLocation::Personal(config.fpx_directory)).await?,
        ),
        ("shared".to_string(), vec![]),
    ]);

    Ok(Json(map))
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum CannedRequestListError {
    #[error("canned request not found")]
    NotFound,

    #[error("failed to handle request: {0:?}")]
    Internal(
        #[serde(skip, default)]
        #[from]
        AnyhowError,
    ),
}

impl IntoResponse for CannedRequestListError {
    fn into_response(self) -> Response {
        error!(error = ?self, "error occurred while listing canned requests");

        let body = serde_json::to_vec(&self)
            .expect("Failed to serialize CannedRequestListError, should not happen");

        let status_code = match self {
            CannedRequestListError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            CannedRequestListError::NotFound => StatusCode::NOT_FOUND,
        };

        (status_code, body).into_response()
    }
}
