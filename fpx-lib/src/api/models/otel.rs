use crate::data::models::HexEncodedId;
use opentelemetry_proto::tonic::collector::trace::v1::ExportTraceServiceRequest;
use opentelemetry_proto::tonic::common::v1::{any_value, KeyValue, KeyValueList};
use opentelemetry_proto::tonic::trace::v1::span::{Event, Link};
use opentelemetry_proto::tonic::trace::v1::status::StatusCode;
use opentelemetry_proto::tonic::trace::v1::{span, Status};
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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct Span {
    pub trace_id: HexEncodedId,
    pub span_id: HexEncodedId,
    pub parent_span_id: Option<HexEncodedId>,

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
                        // .unwrap is safe because we literally encode them in the exact same line as hex
                        Some(HexEncodedId::new(hex::encode(span.parent_span_id)).unwrap())
                    };

                    let events: Vec<_> = span.events.into_iter().map(Into::into).collect();
                    let links: Vec<_> = span.links.into_iter().map(Into::into).collect();

                    // .unwrap is safe because we literally encode them in the exact same line as hex
                    let trace_id = HexEncodedId::new(hex::encode(span.trace_id)).unwrap();
                    let span_id = HexEncodedId::new(hex::encode(span.span_id)).unwrap();

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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
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

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
pub struct AttributeMap(pub BTreeMap<String, Option<AttributeValue>>);

impl From<KeyValueList> for AttributeMap {
    fn from(value: KeyValueList) -> Self {
        value.values.into()
    }
}

impl From<Vec<KeyValue>> for AttributeMap {
    fn from(attributes: Vec<KeyValue>) -> Self {
        let result = attributes
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

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum AttributeValue {
    StringValue(String),
    BoolValue(bool),
    IntValue(i64),
    DoubleValue(f64),
    ArrayValue(Vec<AttributeValue>),
    KvlistValue(AttributeMap),
    BytesValue(Vec<u8>),
}

impl From<any_value::Value> for AttributeValue {
    fn from(value: any_value::Value) -> Self {
        match value {
            any_value::Value::StringValue(val) => AttributeValue::StringValue(val),
            any_value::Value::BoolValue(val) => AttributeValue::BoolValue(val),
            any_value::Value::IntValue(val) => AttributeValue::IntValue(val),
            any_value::Value::DoubleValue(val) => AttributeValue::DoubleValue(val),
            any_value::Value::BytesValue(val) => AttributeValue::BytesValue(val),
            any_value::Value::ArrayValue(val) => val.into(),
            any_value::Value::KvlistValue(val) => AttributeValue::KvlistValue(val.values.into()),
        }
    }
}

impl From<opentelemetry_proto::tonic::common::v1::ArrayValue> for AttributeValue {
    fn from(value: opentelemetry_proto::tonic::common::v1::ArrayValue) -> Self {
        let value: Vec<_> = value
            .values
            .into_iter()
            .flat_map(|value| value.value.map(|value| value.into()))
            .collect();
        AttributeValue::ArrayValue(value)
    }
}

/// A trace contains a summary of its traces.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TraceSummary {
    /// The trace id.
    pub trace_id: HexEncodedId,

    /// Start of the first span
    #[serde(with = "time::serde::rfc3339")]
    pub start_time: time::OffsetDateTime,

    /// End of the last span
    #[serde(with = "time::serde::rfc3339")]
    pub end_time: time::OffsetDateTime,

    /// The numbers of spans that we have for this trace.
    pub num_spans: u32,

    /// A summary of the root span associated with this trace.
    ///
    /// A root span is a span that has no parent span. This can be empty if the
    /// root span was never collected.
    pub root_span: Option<SpanSummary>,
}

impl TraceSummary {
    pub fn from_spans(
        trace_id: HexEncodedId,
        spans: Vec<crate::data::models::Span>,
    ) -> Option<Self> {
        if spans.is_empty() {
            return None;
        }

        let num_spans = spans.len() as u32;

        // Find the first start and the last end time. Note: unwrap is safe here
        // since we check that there is at least 1 span present.
        let start_time = spans.iter().map(|span| span.start_time).min().unwrap();
        let end_time = spans.iter().map(|span| span.end_time).max().unwrap();

        let root_span = spans
            .into_iter()
            .find(|span| span.parent_span_id.is_none())
            .map(|span| span.inner.into_inner().into());

        Some(Self {
            trace_id,
            start_time: start_time.into(),
            end_time: end_time.into(),
            root_span,
            num_spans,
        })
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpanSummary {
    /// The span id.
    pub span_id: HexEncodedId,

    /// The name of the span.
    pub name: String,

    /// The kind of span.
    pub span_kind: SpanKind,

    /// Optional status of the span.
    pub result: Option<Status>,
}

impl From<Span> for SpanSummary {
    fn from(span: Span) -> Self {
        Self {
            span_id: span.span_id,
            name: span.name,
            span_kind: span.kind,
            result: span.status,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn attribute_value_serialize_deserialize() {
        struct Test<'a> {
            input: AttributeValue,
            expected: &'a str,
        }

        let mut kv_list = BTreeMap::new();
        kv_list.insert("key1".to_string(), Some(AttributeValue::IntValue(1234)));
        kv_list.insert(
            "key2".to_string(),
            Some(AttributeValue::DoubleValue(1234.1234)),
        );
        let kv_list: AttributeMap = AttributeMap(kv_list);
        let tests = vec![
            Test {
                input: AttributeValue::IntValue(1234),
                expected: "{\"intValue\":1234}",
            },
            Test {
                input: AttributeValue::DoubleValue(1234.1234),
                expected: "{\"doubleValue\":1234.1234}",
            },
            Test {
                input: AttributeValue::StringValue("hello".to_string()),
                expected: "{\"stringValue\":\"hello\"}",
            },
            Test {
                input: AttributeValue::BoolValue(true),
                expected: "{\"boolValue\":true}",
            },
            Test {
                input: AttributeValue::BytesValue(vec![1, 2, 3, 4]),
                expected: "{\"bytesValue\":[1,2,3,4]}",
            },
            Test {
                input: AttributeValue::ArrayValue(vec![
                    AttributeValue::IntValue(1234),
                    AttributeValue::DoubleValue(1234.1234),
                ]),
                expected: "{\"arrayValue\":[{\"intValue\":1234},{\"doubleValue\":1234.1234}]}",
            },
            Test {
                input: AttributeValue::KvlistValue(kv_list),
                expected: "{\"kvlistValue\":{\"key1\":{\"intValue\":1234},\"key2\":{\"doubleValue\":1234.1234}}}",
            },
        ];

        for test in tests {
            let actual = serde_json::to_string(&test.input).unwrap();
            assert_eq!(actual, test.expected);

            let converted_back: AttributeValue = serde_json::from_str(&actual).unwrap();
            assert_eq!(converted_back, test.input);
        }
    }
}
