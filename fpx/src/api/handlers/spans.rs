use crate::api::errors::{ApiError, ApiServerError, CommonError};
use crate::api::models::Span;
use crate::data::{DbError, Store};
use axum::extract::{Path, State};
use axum::Json;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::error;

#[tracing::instrument(skip_all)]
pub async fn span_get_handler(
    State(store): State<Store>,
    Path((trace_id, span_id)): Path<(String, String)>,
) -> Result<Json<Span>, ApiServerError<SpanGetError>> {
    let tx = store.start_transaction().await?;

    let trace_id = hex::decode(trace_id)
        .map_err(|_| ApiServerError::ServiceError(SpanGetError::InvalidTraceId))?;
    let span_id = hex::decode(span_id)
        .map_err(|_| ApiServerError::ServiceError(SpanGetError::InvalidSpanId))?;

    let span = store.span_get(&tx, trace_id, span_id).await?;

    Ok(Json(span.into()))
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum SpanGetError {
    #[error("Span not found")]
    SpanNotFound,

    #[error("Trace ID is invalid")]
    InvalidTraceId,

    #[error("Span ID is invalid")]
    InvalidSpanId,
}

impl ApiError for SpanGetError {
    fn status_code(&self) -> StatusCode {
        match self {
            SpanGetError::InvalidSpanId | SpanGetError::InvalidTraceId => StatusCode::BAD_REQUEST,
            SpanGetError::SpanNotFound => StatusCode::NOT_FOUND,
        }
    }
}

impl From<DbError> for ApiServerError<SpanGetError> {
    fn from(err: DbError) -> Self {
        match err {
            DbError::NotFound => ApiServerError::ServiceError(SpanGetError::SpanNotFound),
            _ => {
                error!(?err, "Failed to get span from database");
                ApiServerError::CommonError(CommonError::InternalServerError)
            }
        }
    }
}

#[tracing::instrument(skip_all)]
pub async fn span_list_handler(
    State(store): State<Store>,
    Path(trace_id): Path<String>,
) -> Result<Json<Vec<Span>>, ApiServerError<SpanListError>> {
    let tx = store.start_transaction().await?;

    let trace_id = hex::decode(trace_id)
        .map_err(|_| ApiServerError::ServiceError(SpanListError::InvalidTraceId))?;

    let spans = store.span_list_by_trace(&tx, trace_id).await?;
    let spans: Vec<_> = spans.into_iter().map(Into::into).collect();

    Ok(Json(spans))
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum SpanListError {
    #[error("Trace ID is invalid")]
    InvalidTraceId,
}

impl ApiError for SpanListError {
    fn status_code(&self) -> StatusCode {
        match self {
            SpanListError::InvalidTraceId => StatusCode::BAD_REQUEST,
        }
    }
}

impl From<DbError> for ApiServerError<SpanListError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to list spans from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}
