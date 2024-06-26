use crate::data::{DbError, Store};
use crate::events::ServerEvents;
use protos::opentelemetry::proto::collector::trace::v1::trace_service_server::TraceService;
use protos::opentelemetry::proto::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};

pub mod protos {
    tonic::include_proto!("opentelemetry_proto");
}

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
        let trace = ();

        // self.store.trace_create(&tx, trace).await?;

        self.store.commit_transaction(tx).await?;

        let message = ExportTraceServiceResponse {
            partial_success: None,
        };
        Ok(tonic::Response::new(message))
    }
}

impl From<DbError> for tonic::Status {
    fn from(err: DbError) -> Self {
        match err {
            DbError::NotFound => todo!(),
            DbError::FailedDeserialize { message } => todo!(),
            DbError::InvalidJson(_) => todo!(),
            DbError::InternalError(_) => todo!(),
        }
    }
}
