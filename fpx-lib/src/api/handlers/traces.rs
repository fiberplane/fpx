use crate::api::errors::{ApiServerError, CommonError};
use crate::api::models::{TraceSummary, TypeScriptCompatTrace};
use crate::data::{BoxedStore, DbError};
use axum::extract::{Path, State};
use axum::Json;
use fpx_macros::ApiError;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::error;

#[tracing::instrument(skip_all)]
pub async fn ts_compat_traces_list_handler(
    State(store): State<BoxedStore>,
) -> Result<Json<Vec<TypeScriptCompatTrace>>, ApiServerError<TraceListError>> {
    let tx = store.start_readonly_transaction().await?;

    let traces = store.traces_list(&tx).await?;

    let mut result: Vec<TypeScriptCompatTrace> = Vec::new();

    for trace in traces.into_iter() {
        let spans = store.span_list_by_trace(&tx, &trace.trace_id).await?;

        result.push(TypeScriptCompatTrace {
            trace_id: trace.trace_id.clone(),
            spans: spans.iter().map(|span| span.clone().into()).collect(),
        });
    }

    Ok(Json(result))
}

#[tracing::instrument(skip_all)]
pub async fn traces_list_handler(
    State(store): State<BoxedStore>,
) -> Result<Json<Vec<TraceSummary>>, ApiServerError<TraceListError>> {
    let tx = store.start_readonly_transaction().await?;

    let traces = store.traces_list(&tx).await?;

    let mut result = Vec::with_capacity(20);

    for trace in traces.into_iter() {
        let spans = store.span_list_by_trace(&tx, &trace.trace_id).await?;
        if let Some(trace_summary) = TraceSummary::from_spans(trace.trace_id, spans) {
            result.push(trace_summary);
        }
    }

    Ok(Json(result))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum TraceListError {}

impl From<DbError> for ApiServerError<TraceListError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to list trace from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[tracing::instrument(skip_all)]
pub async fn traces_get_handler(
    State(store): State<BoxedStore>,
    Path(trace_id): Path<String>,
) -> Result<Json<TraceSummary>, ApiServerError<TraceGetError>> {
    let tx = store.start_readonly_transaction().await?;

    hex::decode(&trace_id)
        .map_err(|_| ApiServerError::ServiceError(TraceGetError::InvalidTraceId))?;

    // Retrieve all the spans that are associated with the trace
    let spans = store.span_list_by_trace(&tx, &trace_id).await?;

    let trace = TraceSummary::from_spans(trace_id, spans).ok_or(TraceGetError::NotFound)?;

    Ok(Json(trace))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum TraceGetError {
    #[api_error(status_code = StatusCode::BAD_REQUEST)]
    #[error("Trace ID is invalid")]
    InvalidTraceId,

    #[api_error(status_code = StatusCode::NOT_FOUND)]
    #[error("Trace was not found")]
    NotFound,
}

impl From<DbError> for ApiServerError<TraceGetError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to list trace from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[tracing::instrument(skip_all)]
pub async fn traces_delete_handler(
    State(store): State<BoxedStore>,
    Path(trace_id): Path<String>,
) -> Result<StatusCode, ApiServerError<TraceDeleteError>> {
    let tx = store.start_readonly_transaction().await?;

    hex::decode(&trace_id)
        .map_err(|_| ApiServerError::ServiceError(TraceDeleteError::InvalidTraceId))?;

    // Retrieve all the spans that are associated with the trace
    store.span_delete_by_trace(&tx, &trace_id).await?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum TraceDeleteError {
    #[api_error(status_code = StatusCode::BAD_REQUEST)]
    #[error("Trace ID is invalid")]
    InvalidTraceId,
}

impl From<DbError> for ApiServerError<TraceDeleteError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to list trace from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}
