use super::{Json, Timestamp};
use crate::models::{self, SpanKind};
use bytes::Bytes;
use opentelemetry_proto::tonic::collector::trace::v1::ExportTraceServiceRequest;
use serde::Deserialize;
use std::collections::BTreeMap;

#[derive(Debug, Deserialize)]
pub(crate) struct Request {
    pub(crate) id: u32,
    pub(crate) method: String,
    pub(crate) url: String,
    pub(crate) body: String,
    pub(crate) headers: Json<BTreeMap<String, String>>,
}

impl From<Request> for models::Request {
    fn from(req: Request) -> Self {
        models::Request::new(req.id, req.method, req.url, req.body, req.headers.0)
    }
}

#[derive(Deserialize)]
pub struct Span {
    /// The internal ID of the span. Should probably not be exposed at all.
    /// Probably better to use a composite key of trace_id and span_id.
    pub id: i64,

    pub trace_id: Vec<u8>,
    pub span_id: Vec<u8>,

    pub parent_span_id: Option<Vec<u8>>,

    pub name: String,

    pub kind: SpanKind,

    pub scope_name: Option<String>,
    pub scope_version: Option<String>,
    // TODOs:
    // pub status: Json<SpanStatus>,
    // pub links: Json<Vec<SpanLink>>,
    // pub events: Json<Vec<SpanEvent>>,
    // pub attributes: Json<AttributeMap>,
    // pub resources_attributes: Json<AttributeMap>,
    // pub scope_attributes: Json<AttributeMap>,
    pub start_time: Timestamp,
    pub end_time: Timestamp,
}

impl Span {
    pub fn from_collector_request(traces_data: ExportTraceServiceRequest) -> Vec<Self> {
        let mut result = vec![];

        for resource_span in traces_data.resource_spans {
            for scope_span in resource_span.scope_spans {
                let mut scope_name = None;
                let mut scope_version = None;

                if let Some(scope) = scope_span.scope {
                    scope_name = Some(scope.name);
                    scope_version = Some(scope.version);
                }

                for span in scope_span.spans {
                    let kind = span.kind().into();
                    let start_time = Timestamp(span.start_time_unix_nano);
                    let end_time = Timestamp(span.end_time_unix_nano);
                    let parent_span_id = if span.parent_span_id.is_empty() {
                        None
                    } else {
                        Some(span.parent_span_id)
                    };

                    let span = Span {
                        id: 0,
                        trace_id: span.trace_id,
                        span_id: span.span_id,
                        parent_span_id,
                        name: span.name,
                        kind,
                        scope_name: scope_name.clone(),
                        scope_version: scope_version.clone(),
                        start_time,
                        end_time,
                    };
                    result.push(span);
                }
            }
        }

        result
    }
}

#[derive(Deserialize)]
pub struct SpanStatus {
    pub message: String,
    pub code: SpanStatusCode,
}

#[derive(Deserialize)]
pub enum SpanStatusCode {
    Unset,
    Ok,
    Error,
}

#[derive(Deserialize)]
pub struct SpanEvent {
    pub name: String,
    pub attributes: Json<AttributeMap>, // TODO
    pub timestamp: u64,                 // TODO
}

pub type AttributeMap = BTreeMap<String, AttributeValue>;

#[derive(Deserialize)]
pub enum AttributeValue {
    String(String),
    Bool(bool),
    Int64(i64),
    Double(f64),
    Array(Vec<AttributeValue>),
    KeyValueList(AttributeMap),
    Bytes(Bytes),
}
