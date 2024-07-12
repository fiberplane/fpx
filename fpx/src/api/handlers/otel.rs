use crate::api::grpc::extract_trace_ids;
use crate::data::models::Span;
use crate::data::Store;
use crate::events::ServerEvents;
use crate::models::SpanAdded;
use axum::extract::State;
use axum::response::IntoResponse;
use axum::Json;
use opentelemetry_proto::tonic::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};

#[tracing::instrument(skip_all)]
pub async fn trace_collector_handler(
    State(store): State<Store>,
    State(events): State<ServerEvents>,
    Json(payload): Json<ExportTraceServiceRequest>,
) -> impl IntoResponse {
    let trace_ids = extract_trace_ids(&payload);

    let tx = store.start_transaction().await.expect("TODO");

    let spans = Span::from_collector_request(payload);
    for span in spans {
        store.span_create(&tx, span).await.expect("TODO");
    }

    store.commit_transaction(tx).await.expect("TODO");

    events.broadcast(SpanAdded::new(trace_ids).into());

    let message = ExportTraceServiceResponse {
        partial_success: None,
    };

    Json(message)
}
