use crate::api::errors::ApiServerError;
use crate::api::Config;
use crate::canned_requests::{CannedRequest, SaveLocation};
use axum::extract::State;
use axum::Json;
use fpx_macros::ApiError;
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
    canned_request.request.save(save_location).await?;

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

#[derive(Debug, Error, Serialize, Deserialize, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
#[allow(dead_code)]
pub enum CannedRequestCreateError {
    #[api_error(status_code = StatusCode::BAD_REQUEST)]
    #[error("unknown type, expected `ephemeral`, `personal` or `shared`")]
    InvalidType,
}

#[instrument(skip(config))]
pub async fn canned_request_list(
    State(config): State<Config>,
) -> Result<Json<BTreeMap<String, Vec<CannedRequest>>>, ApiServerError<CannedRequestListError>> {
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

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum CannedRequestListError {
    #[api_error(status_code = StatusCode::NOT_FOUND)]
    #[error("canned request not found")]
    NotFound,
}
