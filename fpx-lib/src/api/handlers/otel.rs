use crate::service::Service;
use async_trait::async_trait;
use axum::extract::{FromRequest, Request, State};
use axum::response::{IntoResponse, Response};
use axum::{Json, RequestExt};
use bytes::Bytes;
use http::header::CONTENT_TYPE;
use http::StatusCode;
use http::{HeaderMap, HeaderValue};
use opentelemetry_proto::tonic::collector::trace::v1::ExportTraceServiceRequest;
use prost::Message;
use tracing::error;

/// Collect trace data using the http as the transport and either json or
/// protobuf as the payload.
///
/// Note: this returns a [`Result`] with both of them being a
/// [`impl IntoResponse`] since this way we can support the [`?`] operator. We
#[tracing::instrument(skip_all)]
pub async fn trace_collector_handler<T>(
    State(service): State<Service<T>>,
    headers: HeaderMap,
    JsonOrProtobuf(payload): JsonOrProtobuf<ExportTraceServiceRequest>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let response = service.ingest_export(payload).await.map_err(|err| {
        error!(?err, "failed to ingest export");
        StatusCode::INTERNAL_SERVER_ERROR.into_response()
    })?;

    let content_type = headers
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");

    // Return the response in the same format as the request. The otlp spec
    // specifies that the response needs to be the same content type as the
    // request.
    match content_type {
        "application/json" => Ok(Json(response).into_response()),
        "application/x-protobuf" => {
            let mut buf = bytes::BytesMut::new();
            response.encode(&mut buf).map_err(|err| {
                error!(?err, "unable to encode protobuf message");
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            })?;
            Ok((
                [(
                    CONTENT_TYPE,
                    HeaderValue::from_static("application/x-protobuf"),
                )],
                buf,
            )
                .into_response())
        }
        // In theory this cannot happen since [`JsonOrProtobuf`] only works if
        // the request is either of the above.
        content_type => {
            error!(
                ?content_type,
                "Unsupported content type in response during ingestion"
            );
            Err(StatusCode::UNSUPPORTED_MEDIA_TYPE.into_response())
        }
    }
}

/// Either deserialize the body as a JSON or Protobuf encoded payload.
/// Currently this does a simple check of either the "application/json" or
/// "application/x-protobuf" content type. If neither matches, it will return a
/// [`StatusCode::UNSUPPORTED_MEDIA_TYPE`] error.
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
            // NOTE: there are other types that also are encoded as JSON but
            // have different content-types (see the Json extractor in axum),
            // but we do not have to support them at this time since the otel
            // spec used the "application/json" content type.
            if content_type.starts_with("application/json") {
                let Json(payload) = req.extract().await.map_err(IntoResponse::into_response)?;
                return Ok(Self(payload));
            }

            if content_type.starts_with("application/x-protobuf") {
                let bytes = Bytes::from_request(req, state)
                    .await
                    .map_err(IntoResponse::into_response)?;
                let payload: T = T::decode(bytes).map_err(|err| {
                    error!(?err, "unable to decode protobuf message");
                    StatusCode::BAD_REQUEST.into_response()
                })?;
                return Ok(Self(payload));
            }
        }

        Err(StatusCode::UNSUPPORTED_MEDIA_TYPE.into_response())
    }
}
