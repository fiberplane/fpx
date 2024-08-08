use crate::api::errors::{ApiServerError, CommonError};
use crate::api::models::TraceSummary;
use crate::data::{BoxedStore, DbError};
use axum::extract::{Path, State};
use axum::Json;
use fpx_macros::ApiError;
use http::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::error;

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

    if spans.len() == 0 {
        return Err(TraceGetError::NotFound.into());
    }

    // Find the first start and the last end time. Note: unwrap is safe here
    // since we check that there is at least 1 span present.
    let start_time = spans.iter().map(|span| span.start_time).min().unwrap();
    let end_time = spans.iter().map(|span| span.end_time).max().unwrap();

    let root_span = spans
        .into_iter()
        .find(|span| span.parent_span_id.is_none())
        .map(|span| span.inner.into_inner())
        .map(Into::into);

    // let spans = store.span_list_by_trace(&tx, trace_id).await?;
    // let spans: Vec<_> = spans.into_iter().map(Into::into).collect();

    let trace = TraceSummary {
        trace_id,
        start_time: start_time.into(),
        end_time: end_time.into(),
        root_span,
    };

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
