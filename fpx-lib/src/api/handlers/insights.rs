use crate::api::errors::ApiServerError;
use crate::data::BoxedStore;
use axum::extract::State;
use axum::Json;
use fpx_macros::ApiError;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use time::OffsetDateTime;

/// Returns the total number of requests and the number of failed requests.
#[tracing::instrument(skip_all)]
pub async fn insights_overview_handler(
    State(store): State<BoxedStore>,
) -> Result<Json<InsightsOverviewResponse>, ApiServerError<InsightsOverviewError>> {
    todo!()
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InsightsOverviewResponse {
    total_request: u32,
    failed_request: u32,
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum InsightsOverviewError {}

pub async fn insights_requests_handler(
    State(store): State<BoxedStore>,
) -> Result<InsightsRequestsResponse, InsightsRequestsError> {
    todo!()
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InsightsRequestsResponse {
    requests: Vec<DataPoint>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DataPoint {
    timestamp: OffsetDateTime,
    value: u32,
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum InsightsRequestsError {}
