use super::{AttributeMap, AttributeValue, SpanEvent, SpanKind};
use opentelemetry_proto::tonic::trace::v1::span::Link;
use opentelemetry_proto::tonic::trace::v1::Status;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeScriptCompatSpan {
    pub span_id: Option<String>,
    pub trace_id: Option<String>,
    pub created_at: time::OffsetDateTime,
    pub updated_at: time::OffsetDateTime,
    pub parsed_payload: TypeScriptCompatOtelSpan,
}

impl From<crate::data::models::Span> for TypeScriptCompatSpan {
    fn from(span: crate::data::models::Span) -> Self {
        Self {
            span_id: Some(span.span_id),
            trace_id: Some(span.trace_id),
            created_at: span.end_time.into(),
            updated_at: span.end_time.into(),
            parsed_payload: span.inner.0.into(),
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeScriptCompatTrace {
    pub trace_id: String,
    pub spans: Vec<TypeScriptCompatSpan>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct TypeScriptCompatOtelSpan {
    pub trace_id: String,
    pub span_id: String,
    pub parent_span_id: Option<String>,

    pub name: String,
    pub trace_state: Option<String>,
    pub flags: Option<u32>,
    pub kind: Option<SpanKind>,

    pub scope_name: Option<String>,
    pub scope_version: Option<String>,

    #[serde(with = "time::serde::rfc3339")]
    pub start_time: time::OffsetDateTime,

    #[serde(with = "time::serde::rfc3339")]
    pub end_time: time::OffsetDateTime,

    pub attributes: TypeScriptCompatAttributeMap,
    pub scope_attributes: Option<TypeScriptCompatAttributeMap>,
    pub resource_attributes: Option<TypeScriptCompatAttributeMap>,

    pub status: Option<Status>,
    pub events: Vec<SpanEvent>,
    pub links: Vec<Link>,
}

impl From<crate::api::models::otel::Span> for TypeScriptCompatOtelSpan {
    fn from(span: crate::api::models::otel::Span) -> Self {
        Self {
            trace_id: span.trace_id,
            span_id: span.span_id,
            parent_span_id: span.parent_span_id,
            name: span.name,
            trace_state: Some(span.trace_state),
            flags: Some(span.flags),
            kind: Some(span.kind),
            scope_name: span.scope_name,
            scope_version: span.scope_version,
            start_time: span.start_time,
            end_time: span.end_time,
            attributes: span.attributes.into(),
            scope_attributes: span.scope_attributes.map(Into::into),
            resource_attributes: span.resource_attributes.map(Into::into),
            status: span.status,
            events: span.events,
            links: span.links,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
pub struct TypeScriptCompatAttributeMap(pub BTreeMap<String, Option<serde_json::Value>>);

impl From<AttributeMap> for TypeScriptCompatAttributeMap {
    fn from(attr_map: AttributeMap) -> Self {
        let result = attr_map
            .0
            .into_iter()
            .map(|(key, value)| (key, value.map(Into::into)))
            .collect();

        TypeScriptCompatAttributeMap(result)
    }
}

impl From<crate::api::models::otel::AttributeMap> for serde_json::Map<String, serde_json::Value> {
    fn from(attr_map: crate::api::models::otel::AttributeMap) -> Self {
        attr_map
            .0
            .into_iter()
            .map(|(key, value)| {
                (
                    key,
                    value.map(Into::into).unwrap_or(serde_json::Value::Null),
                )
            })
            .collect()
    }
}

impl From<AttributeValue> for serde_json::Value {
    fn from(value: AttributeValue) -> Self {
        match value {
            AttributeValue::StringValue(value) => value.into(),
            AttributeValue::BoolValue(value) => value.into(),
            AttributeValue::IntValue(value) => value.into(),
            AttributeValue::DoubleValue(value) => value.into(),
            AttributeValue::ArrayValue(values) => values.into(),
            AttributeValue::KvlistValue(value) => serde_json::Value::Object(value.into()),
            AttributeValue::BytesValue(value) => value.into(),
        }
    }
}
