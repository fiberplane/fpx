use crate::api::models::{Span, SpanAdded};
use crate::data::{BoxedStore, DbError};
use crate::events::ServerEvents;
use anyhow::Result;
use opentelemetry_proto::tonic::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};
use std::sync::Arc;
use thiserror::Error;

/// Service implements shared logic for both the gRPC and HTTP API, and possibly
/// any future API interactions.
///
/// An example of its functionality is the ingestion of traces, this is both
/// used by the gRPC and HTTP API. Luckily the models used by both APIs are the
/// same, so we don't have to define an extra model for the Service API.
#[derive(Clone)]
pub struct Service {
    store: BoxedStore,
    events: Arc<dyn ServerEvents>,
}

impl Service {
    pub fn new(store: BoxedStore, events: Arc<dyn ServerEvents>) -> Self {
        Self { store, events }
    }

    /// Ingest the given export message and store it in the [`Store`]. On success
    /// this also broadcast the new trace/spans combinations to
    /// [`ServerEvents`].
    ///
    /// Note that we currently do not support partial success, so it will either
    /// succeed or fail.
    pub async fn ingest_export(
        &self,
        request: ExportTraceServiceRequest,
    ) -> Result<ExportTraceServiceResponse, IngestExportError> {
        let trace_ids = Self::extract_trace_ids(&request);

        let tx = self.store.start_readwrite_transaction().await?;

        let spans = Span::from_collector_request(request);
        for span in spans {
            self.store.span_create(&tx, span.into()).await?;
        }

        self.store.commit_transaction(tx).await?;

        self.events
            .broadcast(SpanAdded::new(trace_ids).into())
            .await;

        Ok(ExportTraceServiceResponse {
            partial_success: None,
        })
    }

    /// Go through the message and extract all trace and span IDs and return
    /// this as a vec of tuples.
    ///
    /// Both the trace and span IDs will be hex encoded.
    fn extract_trace_ids(message: &ExportTraceServiceRequest) -> Vec<(String, String)> {
        message
            .resource_spans
            .iter()
            .flat_map(|span| {
                span.scope_spans.iter().flat_map(|scope_span| {
                    scope_span.spans.iter().map(|inner| {
                        let trace_id = hex::encode(&inner.trace_id);
                        let span_id = hex::encode(&inner.span_id);
                        (trace_id, span_id)
                    })
                })
            })
            .collect()
    }
}

#[derive(Debug, Error)]
#[non_exhaustive]
pub enum IngestExportError {
    #[error("Database error: {0}")]
    DbError(#[from] DbError),
}
