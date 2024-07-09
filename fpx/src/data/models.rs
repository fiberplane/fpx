use crate::models;
use anyhow::Result;
use bytes::Bytes;
use opentelemetry_proto::tonic::trace::v1::TracesData;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::BTreeMap;
use std::ops::{Deref, DerefMut};
use strum::AsRefStr;

#[derive(Debug)]
pub struct Json<T: DeserializeOwned>(T);

impl<T: DeserializeOwned> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: DeserializeOwned> DerefMut for Json<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: DeserializeOwned> AsRef<T> for Json<T> {
    fn as_ref(&self) -> &T {
        &self.0
    }
}

impl<T: DeserializeOwned> AsMut<T> for Json<T> {
    fn as_mut(&mut self) -> &mut T {
        &mut self.0
    }
}

impl<'de, T: DeserializeOwned> Deserialize<'de> for Json<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string: String = Deserialize::deserialize(deserializer)?;
        let json: T = serde_json::from_str(&string).map_err(serde::de::Error::custom)?;

        Ok(Json(json))
    }
}

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

#[derive(Serialize, Deserialize)]
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
    // pub start_time: i64,
    // pub end_time: i64,
}

impl Span {
    pub fn from_otel(traces_data: TracesData) -> Result<Vec<Self>> {
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
                        kind: SpanKind::Internal,
                        scope_name: scope_name.clone(),
                        scope_version: scope_version.clone(),
                    };
                    result.push(span);
                }
            }
        }

        Ok(result)
    }
}

#[derive(Serialize, Deserialize)]
pub struct SpanStatus {
    pub message: String,
    pub code: SpanStatusCode,
}

#[derive(Serialize, Deserialize)]
pub enum SpanStatusCode {
    Unset,
    Ok,
    Error,
}

#[derive(AsRefStr, Serialize, Deserialize, PartialEq, Debug)]
pub enum SpanKind {
    Internal,
    Server,
    Client,
    Producer,
    Consumer,
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
