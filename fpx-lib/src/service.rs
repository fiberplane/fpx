use opentelemetry_proto::tonic::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};

#[derive(Clone)]
pub struct Service {}

impl Service {
    pub async fn ingest_export(
        &self,
        _payload: ExportTraceServiceRequest,
    ) -> Result<ExportTraceServiceResponse, anyhow::Error> {
        todo!()
    }
}
