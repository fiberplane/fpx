use crate::api::errors::{ApiError, ApiServerError, CommonError};
use crate::api::models::Request;
use crate::data::{DbError, Store};
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::Json;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[tracing::instrument(skip_all)]
pub async fn request_get_handler(
    State(store): State<Store>,
    Path(id): Path<i64>,
) -> Result<Json<Request>, ApiServerError<RequestGetError>> {
    let tx = store.start_transaction().await?;

    let request = store.request_get(&tx, id).await?;

    Ok(Json(request))
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RequestGetError {
    #[error("Request not found")]
    RequestNotFound,
}

impl ApiError for RequestGetError {
    fn status_code(&self) -> StatusCode {
        match self {
            RequestGetError::RequestNotFound => StatusCode::NOT_FOUND,
        }
    }
}

impl From<DbError> for ApiServerError<RequestGetError> {
    fn from(value: DbError) -> Self {
        match value {
            DbError::NotFound => ApiServerError::ServiceError(RequestGetError::RequestNotFound),
            _ => ApiServerError::CommonError(CommonError::InternalServerError),
        }
    }
}

#[tracing::instrument(skip_all)]
pub async fn request_delete_handler() -> impl IntoResponse {
    StatusCode::NOT_IMPLEMENTED
}
