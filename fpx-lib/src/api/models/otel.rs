use opentelemetry_proto::tonic::common::v1::{any_value, KeyValueList};
use opentelemetry_proto::tonic::trace::v1::span::{Event, Link};
use opentelemetry_proto::tonic::trace::v1::status::StatusCode;
use opentelemetry_proto::tonic::trace::v1::{span, Status};
use opentelemetry_proto::tonic::{
    collector::trace::v1::ExportTraceServiceRequest, common::v1::KeyValue,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use strum::AsRefStr;

fn parse_time_nanos(nanos: u64) -> time::OffsetDateTime {
    // NOTE: this should not happen any time soon, so we should be able to
    //       get away with this for now.
    time::OffsetDateTime::from_unix_timestamp_nanos(nanos as i128)
        .expect("timestamp is too large for OffsetDateTime")
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Span {
    pub trace_id: String,
    pub span_id: String,
    pub parent_span_id: Option<String>,

    pub name: String,
    pub trace_state: String,
    pub flags: u32,
    pub kind: SpanKind,

    pub scope_name: Option<String>,
    pub scope_version: Option<String>,

    #[serde(with = "time::serde::rfc3339")]
    pub start_time: time::OffsetDateTime,

    #[serde(with = "time::serde::rfc3339")]
    pub end_time: time::OffsetDateTime,

    pub attributes: AttributeMap,
    pub scope_attributes: Option<AttributeMap>,
    pub resource_attributes: Option<AttributeMap>,

    pub status: Option<Status>,
    pub events: Vec<SpanEvent>,
    pub links: Vec<Link>,
}

impl Span {
    pub fn from_collector_request(traces_data: ExportTraceServiceRequest) -> Vec<Self> {
        let mut result = vec![];

        for resource_span in traces_data.resource_spans {
            let resource_attributes = resource_span
                .resource
                .map(|resource| resource.attributes.into());

            for scope_span in resource_span.scope_spans {
                let mut scope_name = None;
                let mut scope_version = None;

                if let Some(ref scope) = scope_span.scope {
                    scope_name = Some(scope.name.clone());
                    scope_version = Some(scope.version.clone());
                }

                let scope_attributes = scope_span.scope.map(|scope| scope.attributes.into());

                for span in scope_span.spans {
                    let kind = span.kind().into();
                    let attributes = span.attributes.into();

                    let start_time = parse_time_nanos(span.start_time_unix_nano);
                    let end_time = parse_time_nanos(span.end_time_unix_nano);

                    let parent_span_id = if span.parent_span_id.is_empty() {
                        None
                    } else {
                        Some(hex::encode(span.parent_span_id))
                    };

                    let events: Vec<_> = span.events.into_iter().map(Into::into).collect();
                    let links: Vec<_> = span.links.into_iter().map(Into::into).collect();

                    let trace_id = hex::encode(span.trace_id);
                    let span_id = hex::encode(span.span_id);

                    let name = span.name;
                    let trace_state = span.trace_state;
                    let flags = span.flags;

                    let span = Self {
                        trace_id,
                        span_id,
                        parent_span_id,
                        name,
                        trace_state,
                        flags,
                        kind,
                        scope_name: scope_name.clone(),
                        scope_version: scope_version.clone(),
                        start_time,
                        end_time,
                        attributes,
                        scope_attributes: scope_attributes.clone(),
                        resource_attributes: resource_attributes.clone(),
                        status: span.status.map(Into::into),
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

#[derive(Default, Serialize, Deserialize, PartialEq, Debug, Clone, AsRefStr, JsonSchema)]
pub enum SpanKind {
    Internal,
    Server,
    Client,
    Producer,
    Consumer,

    #[default]
    Unspecified,
}

impl From<span::SpanKind> for SpanKind {
    fn from(value: span::SpanKind) -> Self {
        match value {
            span::SpanKind::Unspecified => SpanKind::Unspecified,
            span::SpanKind::Internal => SpanKind::Internal,
            span::SpanKind::Server => SpanKind::Server,
            span::SpanKind::Client => SpanKind::Client,
            span::SpanKind::Producer => SpanKind::Producer,
            span::SpanKind::Consumer => SpanKind::Consumer,
        }
    }
}

#[cfg(feature = "libsql")]
impl From<SpanKind> for libsql::Value {
    fn from(value: SpanKind) -> Self {
        value.as_ref().into()
    }
}

#[cfg(feature = "wasm-bindgen")]
impl From<SpanKind> for wasm_bindgen::JsValue {
    fn from(value: SpanKind) -> Self {
        wasm_bindgen::JsValue::from_str(value.as_ref())
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpanEvent {
    pub name: String,

    #[serde(with = "time::serde::rfc3339")]
    pub timestamp: time::OffsetDateTime,

    pub attributes: AttributeMap,
}

impl From<Event> for SpanEvent {
    fn from(event: Event) -> Self {
        Self {
            name: event.name,
            timestamp: parse_time_nanos(event.time_unix_nano),
            attributes: event.attributes.into(),
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct SpanLink {
    pub trace_id: String,
    pub span_id: String,
    pub trace_state: String,
    pub attributes: AttributeMap,
    pub flags: u32,
}

impl From<Link> for SpanLink {
    fn from(link: Link) -> Self {
        Self {
            trace_id: hex::encode(link.trace_id),
            span_id: hex::encode(link.span_id),
            trace_state: link.trace_state,
            attributes: link.attributes.into(),
            flags: link.flags,
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct SpanStatus {
    pub code: SpanStatusCode,
    pub message: String,
}

impl From<Status> for SpanStatus {
    fn from(value: Status) -> Self {
        Self {
            code: value.code().into(),
            message: value.message,
        }
    }
}

#[derive(Deserialize, Serialize)]
pub enum SpanStatusCode {
    Unset,
    Ok,
    Error,
}

impl From<StatusCode> for SpanStatusCode {
    fn from(status_code: StatusCode) -> Self {
        match status_code {
            StatusCode::Unset => SpanStatusCode::Unset,
            StatusCode::Ok => SpanStatusCode::Ok,
            StatusCode::Error => SpanStatusCode::Error,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct AttributeMap(BTreeMap<String, Option<AttributeValue>>);

impl From<KeyValueList> for AttributeMap {
    fn from(value: KeyValueList) -> Self {
        value.values.into()
    }
}

impl From<Vec<KeyValue>> for AttributeMap {
    fn from(attributes: Vec<KeyValue>) -> Self {
        let result: BTreeMap<String, Option<AttributeValue>> = attributes
            .into_iter()
            .map(|kv| {
                (
                    kv.key,
                    kv.value.and_then(|value| value.value.map(Into::into)),
                )
            })
            .collect();

        AttributeMap(result)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AttributeValue {
    String(String),
    Bool(bool),
    Int(i64),
    Double(f64),
    Array(Vec<AttributeValue>),
    KeyValueList(AttributeMap),
    Bytes(Vec<u8>),
}

impl From<any_value::Value> for AttributeValue {
    fn from(value: any_value::Value) -> Self {
        match value {
            any_value::Value::StringValue(val) => AttributeValue::String(val),
            any_value::Value::BoolValue(val) => AttributeValue::Bool(val),
            any_value::Value::IntValue(val) => AttributeValue::Int(val),
            any_value::Value::DoubleValue(val) => AttributeValue::Double(val),
            any_value::Value::BytesValue(val) => AttributeValue::Bytes(val),
            any_value::Value::ArrayValue(val) => {
                let val: Vec<_> = val
                    .values
                    .into_iter()
                    .flat_map(|value| value.value.map(|value| value.into()))
                    .collect();
                AttributeValue::Array(val)
            }
            any_value::Value::KvlistValue(val) => AttributeValue::KeyValueList(val.values.into()),
        }
    }
}
