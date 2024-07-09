use crate::data::{DbError, Store};
use crate::events::ServerEvents;
use crate::models::TraceAdded;
use opentelemetry_proto::tonic::collector::trace::v1::trace_service_server::TraceService;
use opentelemetry_proto::tonic::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};

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
        let tx = self.store.start_transaction().await?;

        // let spans: Vec<Span> = request.get_ref();

        self.store.commit_transaction(tx).await?;

        let trace_ids = extract_trace_ids(request.get_ref());

        // let serialized = serde_json::to_string(request.get_ref()).unwrap();
        // eprintln!("dump:\n{}", serialized);

        self.events.broadcast(TraceAdded::new(trace_ids).into());

        let message = ExportTraceServiceResponse {
            partial_success: None,
        };
        Ok(tonic::Response::new(message))
    }
}

pub fn extract_trace_ids(message: &ExportTraceServiceRequest) -> Vec<Vec<u8>> {
    message
        .resource_spans
        .iter()
        .flat_map(|span| {
            span.scope_spans
                .iter()
                .flat_map(|scope_span| scope_span.spans.iter().map(|inner| inner.trace_id.clone()))
        })
        .collect()
}

impl From<DbError> for tonic::Status {
    fn from(err: DbError) -> Self {
        match err {
            DbError::NotFound => todo!(),
            DbError::FailedDeserialize { .. } => todo!(),
            DbError::InternalError(_) => todo!(),
        }
    }
}
