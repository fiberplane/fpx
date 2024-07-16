use crate::api::grpc::extract_trace_ids;
use crate::api::models::SpanAdded;
use crate::data::models::Span;
use crate::data::Store;
use crate::events::ServerEvents;
use async_trait::async_trait;
use axum::extract::State;
use axum::extract::{FromRequest, Request};
use axum::response::{IntoResponse, Response};
use axum::{Json, RequestExt};
use bytes::Bytes;
use http::header::CONTENT_TYPE;
use http::HeaderMap;
use http::StatusCode;
use opentelemetry_proto::tonic::collector::trace::v1::{
    ExportTraceServiceRequest, ExportTraceServiceResponse,
};
use prost::Message;
use tracing::error;

#[tracing::instrument(skip_all)]
pub async fn trace_collector_handler(
    State(store): State<Store>,
    State(events): State<ServerEvents>,
    headers: HeaderMap,
    JsonOrProtobuf(payload): JsonOrProtobuf<ExportTraceServiceRequest>,
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

    let content_type = headers
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");

    match content_type {
        "application/json" => Json(message).into_response(),
        "application/x-protobuf" => {
            let mut buf = bytes::BytesMut::new();
            message.encode(&mut buf).expect("TODO");
            buf.into_response()
        }
        content_type => {
            error!("unsupported content type: {}", content_type);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

pub struct JsonOrProtobuf<T>(T);

#[async_trait]
impl<T, S> FromRequest<S> for JsonOrProtobuf<T>
where
    S: Send + Sync,
    Json<T>: FromRequest<()>,
    T: Message + Default,
    T: 'static,
{
    type Rejection = Response;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let content_type_header = req.headers().get(CONTENT_TYPE);
        let content_type = content_type_header.and_then(|value| value.to_str().ok());

        if let Some(content_type) = content_type {
            if content_type.starts_with("application/json") {
                let Json(payload) = req.extract().await.map_err(IntoResponse::into_response)?;
                return Ok(Self(payload));
            }

            if content_type.starts_with("application/x-protobuf") {
                let bytes = Bytes::from_request(req, state)
                    .await
                    .map_err(IntoResponse::into_response)?;
                let payload: T = T::decode(bytes).expect("TODO");
                return Ok(Self(payload));
            }
        }

        Err(StatusCode::UNSUPPORTED_MEDIA_TYPE.into_response())
    }
}
