use crate::api::models::{Span, SpanAdded};
use crate::data::{DbError, Store};
use crate::events::ServerEvents;
use opentelemetry_proto::tonic::collector::trace::v1::trace_service_server::TraceService;
use opentelemetry_proto::tonic::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};
use tracing::error;

#[derive(Clone)]
pub struct GrpcService {
    store: Store,
    events: ServerEvents,
}

impl GrpcService {
    pub fn new(store: Store, events: ServerEvents) -> Self {
        Self { store, events }
    }
}

#[tonic::async_trait]
impl TraceService for GrpcService {
    async fn export(
        &self,
        request: tonic::Request<ExportTraceServiceRequest>,
    ) -> Result<tonic::Response<ExportTraceServiceResponse>, tonic::Status> {
        let trace_ids = extract_trace_ids(request.get_ref());

        let (_, _, export_trace_service_request) = request.into_parts();

        let tx = self.store.start_transaction().await?;

        let spans = Span::from_collector_request(export_trace_service_request);

        for span in spans {
            self.store.span_create(&tx, span.into()).await?;
        }

        self.store.commit_transaction(tx).await?;

        self.events.broadcast(SpanAdded::new(trace_ids).into());

        let message = ExportTraceServiceResponse {
            partial_success: None,
        };
        Ok(tonic::Response::new(message))
    }
}

pub fn extract_trace_ids(message: &ExportTraceServiceRequest) -> Vec<(String, String)> {
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

impl From<DbError> for tonic::Status {
    fn from(err: DbError) -> Self {
        error!("Database error: {:?}", err);
        match err {
            DbError::NotFound => tonic::Status::not_found("message"),
            DbError::FailedDeserialize { .. } => tonic::Status::internal("internal database error"),
            DbError::InternalError(_) => tonic::Status::internal("internal error"),
        }
    }
}
