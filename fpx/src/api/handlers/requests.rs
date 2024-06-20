use crate::api::errors::{ApiServerError, CommonError};
use crate::data::{DbError, Store};
use crate::schemas::Request;
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

impl IntoResponse for RequestGetError {
    fn into_response(self) -> axum::response::Response {
        let body = serde_json::to_vec(&self)
            .expect("Failed to serialize RequestGetError, should not happen");
        match self {
            RequestGetError::RequestNotFound => (StatusCode::NOT_FOUND, body).into_response(),
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
