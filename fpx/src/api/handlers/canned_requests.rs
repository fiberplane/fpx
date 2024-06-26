use crate::api::errors::ApiServerError;
use crate::api::FpxDirectoryPath;
use crate::canned_requests::{CannedRequest, SaveLocation};
use axum::extract::{Query, State};
use axum::response::{IntoResponse, Response};
use axum::Json;
use http::StatusCode;
use serde::Serialize;
use serde_with::serde_derive::Deserialize;
use std::collections::BTreeMap;
use thiserror::Error;
use tracing::{error, instrument};

#[instrument(skip(fpx_directory_path))]
pub async fn canned_request_create(
    State(FpxDirectoryPath(fpx_directory_path)): State<FpxDirectoryPath>,
    Query(args): Query<CannedRequestCreateArgs>,
    Json(canned_request): Json<CannedRequest>,
) -> Result<StatusCode, ApiServerError<CannedRequestCreateError>> {
    let save_location = SaveLocation::try_parse(&args.type_, fpx_directory_path)
        .map_err(|_| CannedRequestCreateError::UnknownType)?;

    canned_request.save(save_location).await?;

    Ok(StatusCode::CREATED)
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct CannedRequestCreateArgs {
    #[serde(rename = "type")]
    type_: String,

    name: String,
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum CannedRequestCreateError {
    #[error("unknown type, expected `ephemeral`, `personal` or `shared`")]
    UnknownType,

    #[error("failed to create directory")]
    DirectoryCreationFailed,

    #[error("failed to serialize")]
    SerializationFailed,

    #[error("failed to write to file")]
    FileWriteFailed,
}

impl IntoResponse for CannedRequestCreateError {
    fn into_response(self) -> Response {
        error!(error = ?self, "error occurred while creating canned request");

        let body = serde_json::to_vec(&self)
            .expect("Failed to serialize CannedRequestCreateError, should not happen");

        let status_code = match self {
            CannedRequestCreateError::UnknownType => StatusCode::BAD_REQUEST,
            CannedRequestCreateError::DirectoryCreationFailed => StatusCode::INTERNAL_SERVER_ERROR,
            CannedRequestCreateError::SerializationFailed => StatusCode::INTERNAL_SERVER_ERROR,
            CannedRequestCreateError::FileWriteFailed => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status_code, body).into_response()
    }
}

#[instrument(skip(fpx_directory_path))]
pub async fn canned_request_list(
    State(FpxDirectoryPath(fpx_directory_path)): State<FpxDirectoryPath>,
) -> Result<Json<BTreeMap<String, Vec<CannedRequest>>>, CannedRequestListError> {
    let map = BTreeMap::from([
        (
            "ephemeral".to_string(),
            CannedRequest::load_all(SaveLocation::Ephemeral).await?,
        ),
        (
            "personal".to_string(),
            CannedRequest::load_all(SaveLocation::Personal(fpx_directory_path)).await?,
        ),
        ("shared".to_string(), vec![]),
    ]);

    Ok(Json(map))
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum CannedRequestListError {
    #[error("failed to convert file name from OsString into &str")]
    OsStringConversionFailed,

    #[error("file not found")]
    NotFound,

    #[error("failed to read directory")]
    DirectoryReadFailed,

    #[error("failed to read file")]
    FileReadFailed,

    #[error("failed to deserialize")]
    DeserializationFailed,
}

impl IntoResponse for CannedRequestListError {
    fn into_response(self) -> Response {
        error!(error = ?self, "error occurred while listing canned requests");

        let body = serde_json::to_vec(&self)
            .expect("Failed to serialize CannedRequestListError, should not happen");

        let status_code = match self {
            CannedRequestListError::OsStringConversionFailed => StatusCode::INTERNAL_SERVER_ERROR,
            CannedRequestListError::NotFound => StatusCode::NOT_FOUND,
            CannedRequestListError::DirectoryReadFailed => StatusCode::INTERNAL_SERVER_ERROR,
            CannedRequestListError::FileReadFailed => StatusCode::INTERNAL_SERVER_ERROR,
            CannedRequestListError::DeserializationFailed => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status_code, body).into_response()
    }
}
