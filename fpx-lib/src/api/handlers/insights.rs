use crate::api::errors::{ApiServerError, CommonError};
use crate::data::{BoxedStore, DbError};
use axum::extract::{Query, State};
use axum::Json;
use fpx_macros::ApiError;
use opentelemetry_proto::tonic::trace::v1::status::StatusCode;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;
use time::{Duration, OffsetDateTime};
use tracing::error;

/// Returns the total number of requests and the number of failed requests.
#[tracing::instrument(skip_all)]
pub async fn insights_overview_handler(
    State(store): State<BoxedStore>,
    Query(query): Query<InsightsOverviewQuery>,
) -> Result<Json<InsightsOverviewResponse>, ApiServerError<InsightsOverviewError>> {
    let tx = store.start_readonly_transaction().await?;

    let timestamp = OffsetDateTime::now_utc() - Duration::hours(1);
    let spans = store.insights_list_all(&tx, timestamp.into()).await?;

    let total_request = spans.len() as u32;
    let mut failed_request = 0;

    let now = OffsetDateTime::now_utc();
    let mut buckets = Buckets::new(now, now - Duration::hours(1), 60);

    for span in spans {
        // let's _just_ use the status from the otel span to determine if the
        // call was successful. Future functionality should probably be either
        // the status as we have it now and if it is not set then try to
        // determine it from the http status code. (note: we should also make
        // sure that our middleware sets the status to error on 5xx).
        let is_successful = match span.as_inner().status {
            Some(ref status) => match status.code() {
                StatusCode::Unset => true,
                StatusCode::Ok => true,
                StatusCode::Error => false,
            },
            None => true,
        };

        if !is_successful {
            failed_request += 1;
        }

        buckets.ingest_request(&span.start_time.as_offset_data_time(), is_successful);
    }

    let data_points = buckets.to_datapoints();

    Ok(InsightsOverviewResponse {
        total_request,
        failed_request,
        requests: data_points,
    }
    .into())
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InsightsOverviewQuery {
    since: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct InsightsOverviewResponse {
    total_request: u32,
    failed_request: u32,
    requests: Vec<DataPoint>,
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum InsightsOverviewError {}

impl From<DbError> for ApiServerError<InsightsOverviewError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to list spans from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataPoint {
    timestamp: OffsetDateTime,
    total_requests: u32,
    failed_requests: u32,
}

struct Buckets {
    buckets: HashMap<OffsetDateTime, usize>,
    boundaries: Vec<OffsetDateTime>,
}

impl Buckets {
    pub fn new(min: OffsetDateTime, max: OffsetDateTime, resolution: u32) -> Self {
        let total_duration = max - min;
        let bucket_duration = total_duration / resolution;

        let mut buckets = HashMap::with_capacity(resolution as usize);
        let mut boundaries = Vec::with_capacity(resolution as usize);

        for i in 0..resolution {
            let k = min + (i * bucket_duration);
            buckets.insert(k, 0);
            boundaries.push(k);
        }

        Buckets {
            buckets,
            boundaries,
        }
    }

    pub fn ingest_request(&mut self, timestamp: &OffsetDateTime, is_successful: bool) {
        // TODO: support success/failed
        let boundary: OffsetDateTime = {
            self.boundaries
                .iter()
                .rev()
                .find(|boundary| timestamp > *boundary)
                .expect("no boundary found")
                .clone()
        };

        self.buckets.entry(boundary).and_modify(|entry| *entry += 1);
    }

    pub fn to_datapoints(self) -> Vec<DataPoint> {
        let mut result = Vec::with_capacity(self.boundaries.len());

        for boundary in self.boundaries {
            let total_requests = self.buckets[&boundary];
            result.push(DataPoint {
                timestamp: boundary,
                total_requests: total_requests as u32,
                failed_requests: 0,
            });
        }

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::format_description::well_known::Rfc3339;

    #[test]
    fn buckets_tests() {
        let min = OffsetDateTime::parse("2024-01-01T12:00:00+00:00", &Rfc3339).unwrap();
        let max = OffsetDateTime::parse("2024-01-01T13:00:00+00:00", &Rfc3339).unwrap();
        let mut buckets = Buckets::new(min, max, 60);

        let d1 = OffsetDateTime::parse("2024-01-01T12:00:30+00:00", &Rfc3339).unwrap();
        buckets.ingest_request(&d1.into(), true);

        let d2 = OffsetDateTime::parse("2024-01-01T12:00:35+00:00", &Rfc3339).unwrap();
        buckets.ingest_request(&d2.into(), true);

        let datapoints = buckets.to_datapoints();

        assert_eq!(datapoints.len(), 60);
        assert_eq!(datapoints[0].total_requests, 2);
        assert_eq!(datapoints[1].total_requests, 0);
    }
}
