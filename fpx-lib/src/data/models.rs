use crate::api;
use crate::api::models::SpanKind;
use crate::data::util::{Json, Timestamp};
use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize};
use std::fmt::Formatter;
use std::ops::Deref;
use std::str::FromStr;

/// A computed value based on the span objects that are present.
#[derive(Clone, Debug, Deserialize)]
pub struct Trace {
    pub trace_id: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq)]
pub struct Span {
    pub trace_id: String,
    pub span_id: String,
    pub parent_span_id: Option<String>,

    pub name: String,
    pub kind: SpanKind,

    pub start_time: Timestamp,
    pub end_time: Timestamp,

    pub inner: Json<api::models::Span>,
}

impl Span {
    pub fn into_inner(self) -> api::models::Span {
        self.inner.into_inner()
    }

    pub fn as_inner(&self) -> &api::models::Span {
        self.inner.as_ref()
    }
}

impl From<Span> for api::models::Span {
    fn from(value: Span) -> Self {
        value.into_inner()
    }
}

impl From<api::models::Span> for Span {
    fn from(span: api::models::Span) -> Self {
        let trace_id = span.trace_id.clone();
        let span_id = span.span_id.clone();
        let parent_span_id = span.parent_span_id.clone();
        let name = span.name.clone();
        let kind = span.kind.clone();
        let start_time = span.start_time.into();
        let end_time = span.end_time.into();
        let inner = Json(span);

        Self {
            trace_id,
            span_id,
            parent_span_id,
            name,
            kind,
            start_time,
            end_time,
            inner,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct TraceId(String);

impl TraceId {
    fn new(input: impl Into<String>) -> Result<TraceId, hex::FromHexError> {
        let id = TraceId(input.into());
        id.validate()?;

        Ok(id)
    }

    fn validate(&self) -> Result<(), hex::FromHexError> {
        hex::decode(&self.0).map(|_| ())
    }
}

impl From<TraceId> for String {
    fn from(value: TraceId) -> Self {
        value.0
    }
}

impl FromStr for TraceId {
    type Err = hex::FromHexError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        TraceId::new(s)
    }
}

impl Deref for TraceId {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

struct TraceIdVisitor;

impl<'de> Visitor<'de> for TraceIdVisitor {
    type Value = TraceId;

    fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
        formatter.write_str("a hex-represented string")
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: Error,
    {
        TraceId::new(v).map_err(Error::custom)
    }

    fn visit_borrowed_str<E>(self, v: &'de str) -> Result<Self::Value, E>
    where
        E: Error,
    {
        TraceId::new(v).map_err(Error::custom)
    }

    fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
    where
        E: Error,
    {
        TraceId::new(v).map_err(Error::custom)
    }
}

impl<'de> Deserialize<'de> for TraceId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_string(TraceIdVisitor)
    }
}
