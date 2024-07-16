use super::{Json, Timestamp};
use crate::api::models::{self, SpanKind};
use opentelemetry_proto::tonic::collector::trace::v1::ExportTraceServiceRequest;
use opentelemetry_proto::tonic::common::v1::{any_value, AnyValue, KeyValue};
use opentelemetry_proto::tonic::trace::v1::span::{Event, Link};
use opentelemetry_proto::tonic::trace::v1::status;
use serde::{Deserialize, Serialize};
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

#[derive(Default, Deserialize)]
pub struct Span {
    pub trace_id: Vec<u8>,
    pub span_id: Vec<u8>,

    pub parent_span_id: Option<Vec<u8>>,

    pub name: String,
    pub state: String,
    pub flags: u32,
    pub kind: SpanKind,

    pub scope_name: Option<String>,
    pub scope_version: Option<String>,

    pub attributes: Json<AttributeMap>,
    pub resource_attributes: Option<Json<AttributeMap>>,
    pub scope_attributes: Option<Json<AttributeMap>>,

    pub start_time: Timestamp,
    pub end_time: Timestamp,

    pub status: Option<Json<SpanStatus>>,
    pub events: Json<Vec<SpanEvent>>,
    pub links: Json<Vec<SpanLink>>,
}

impl Span {
    pub fn from_collector_request(traces_data: ExportTraceServiceRequest) -> Vec<Self> {
        let mut result = vec![];

        for resource_span in traces_data.resource_spans {
            let resource_attributes = resource_span
                .resource
                .map(|resource| AttributeMap::from_otel(resource.attributes));

            for scope_span in resource_span.scope_spans {
                let mut scope_name = None;
                let mut scope_version = None;

                if let Some(ref scope) = scope_span.scope {
                    scope_name = Some(scope.name.clone());
                    scope_version = Some(scope.version.clone());
                }

                let scope_attributes = scope_span
                    .scope
                    .map(|scope| AttributeMap::from_otel(scope.attributes));

                for span in scope_span.spans {
                    let kind = span.kind().into();
                    let attributes = Json(AttributeMap::from_otel(span.attributes));

                    let start_time = Timestamp(span.start_time_unix_nano);
                    let end_time = Timestamp(span.end_time_unix_nano);

                    let parent_span_id = if span.parent_span_id.is_empty() {
                        None
                    } else {
                        Some(span.parent_span_id)
                    };

                    let events: Vec<_> = span.events.into_iter().map(Into::into).collect();
                    let events = Json(events);

                    let links: Vec<_> = span.links.into_iter().map(Into::into).collect();
                    let links = Json(links);

                    let span = Span {
                        trace_id: span.trace_id,
                        span_id: span.span_id,
                        parent_span_id,
                        name: span.name,
                        state: span.trace_state,
                        flags: span.flags,
                        kind,
                        scope_name: scope_name.clone(),
                        scope_version: scope_version.clone(),
                        attributes,
                        scope_attributes: scope_attributes.clone().map(Json),
                        resource_attributes: resource_attributes.clone().map(Json),
                        start_time,
                        end_time,
                        status: span.status.map(|status| {
                            Json(SpanStatus {
                                code: status.code().into(),
                                message: status.message,
                            })
                        }),
                        events,
                        links,
                    };
                    result.push(span);
                }
            }
        }

        result
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SpanStatus {
    pub message: String,
    pub code: SpanStatusCode,
}

#[derive(Clone, Serialize, Deserialize)]
pub enum SpanStatusCode {
    Unset,
    Ok,
    Error,
}

impl From<status::StatusCode> for SpanStatusCode {
    fn from(status_code: status::StatusCode) -> Self {
        match status_code {
            status::StatusCode::Unset => SpanStatusCode::Unset,
            status::StatusCode::Ok => SpanStatusCode::Ok,
            status::StatusCode::Error => SpanStatusCode::Error,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct SpanLink {
    pub trace_id: Vec<u8>,
    pub span_id: Vec<u8>,
    pub trace_state: String,
    pub attributes: AttributeMap,
    pub flags: u32,
}

impl From<Link> for SpanLink {
    fn from(link: Link) -> Self {
        Self {
            trace_id: link.trace_id,
            span_id: link.span_id,
            trace_state: link.trace_state,
            attributes: AttributeMap::from_otel(link.attributes),
            flags: link.flags,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct SpanEvent {
    pub name: String,
    pub attributes: AttributeMap,
    pub timestamp: Timestamp,
}

impl From<Event> for SpanEvent {
    fn from(event: Event) -> Self {
        Self {
            name: event.name,
            attributes: AttributeMap::from_otel(event.attributes),
            timestamp: Timestamp(event.time_unix_nano),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct AttributeMap(BTreeMap<String, Option<AttributeValue>>);

impl AttributeMap {
    pub fn from_otel(attributes: Vec<KeyValue>) -> Self {
        let mut result = BTreeMap::new();

        for kv in attributes {
            let key = kv.key.clone();
            let value = AttributeValue::from_key_value(kv);
            result.entry(key).or_insert_with(|| value);
        }

        AttributeMap(result)
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub enum AttributeValue {
    String(String),
    Bool(bool),
    Int(i64),
    Double(f64),
    Array(Vec<Option<AttributeValue>>),
    KeyValueList(AttributeMap),
    Bytes(Vec<u8>),
}

impl AttributeValue {
    pub fn from_key_value(value: KeyValue) -> Option<Self> {
        let value = value.value?;
        Self::from_any_value(value)
    }

    pub fn from_any_value(value: AnyValue) -> Option<Self> {
        match value.value? {
            any_value::Value::StringValue(val) => Some(AttributeValue::String(val)),
            any_value::Value::BoolValue(val) => Some(AttributeValue::Bool(val)),
            any_value::Value::IntValue(val) => Some(AttributeValue::Int(val)),
            any_value::Value::DoubleValue(val) => Some(AttributeValue::Double(val)),
            any_value::Value::BytesValue(val) => Some(AttributeValue::Bytes(val)),
            any_value::Value::ArrayValue(val) => {
                let val: Vec<_> = val
                    .values
                    .into_iter()
                    .map(AttributeValue::from_any_value)
                    .collect();
                Some(AttributeValue::Array(val))
            }
            any_value::Value::KvlistValue(val) => {
                let val = AttributeMap::from_otel(val.values);
                Some(AttributeValue::KeyValueList(val))
            }
        }
    }
}
