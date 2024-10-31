use crate::api;
use crate::api::models::SpanKind;
use crate::data::util::{Json, Timestamp};
use libsql::params::IntoValue;
use libsql::Value;
use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize};
use std::fmt;
use std::fmt::Display;
use std::ops::Deref;
use std::str::FromStr;

/// A computed value based on the span objects that are present.
#[derive(Clone, Debug, Deserialize)]
pub struct Trace {
    pub trace_id: HexEncodedId,
}

#[derive(Clone, Debug, Deserialize, PartialEq)]
pub struct Span {
    pub trace_id: HexEncodedId,
    pub span_id: HexEncodedId,
    pub parent_span_id: Option<HexEncodedId>,

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
        let kind = span.kind.clone().unwrap_or(SpanKind::Unspecified);
        let start_time = span.start_time.into();
        let end_time = span.end_time.into();
        let inner = Json(span);

        // these .unwrap are safe as these are guaranteed to be valid as they come from the api `Span`
        Self {
            trace_id: HexEncodedId::new(trace_id).unwrap(),
            span_id: HexEncodedId::new(span_id).unwrap(),
            parent_span_id: parent_span_id
                .map(|parent_span_id| HexEncodedId::new(parent_span_id).unwrap()),
            name,
            kind,
            start_time,
            end_time,
            inner,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AllRoutes {
    pub base_url: String,
    pub routes: Vec<Route>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Route {
    pub id: i32,
    pub path: String,
    pub method: String,
    pub handler: String,
    pub handler_type: String,
    pub currently_registered: bool,
    pub registration_order: i32,
    pub route_origin: RouteOrigin,
    pub openapi_spec: String,
    pub request_type: RequestType,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RouteOrigin {
    Discovered,
    Custom,
    OpenApi,
}

impl Display for RouteOrigin {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}",
            serde_json::to_string(&self).expect("serialization to always work")
        )
    }
}

impl IntoValue for RouteOrigin {
    fn into_value(self) -> libsql::Result<Value> {
        let serialized = serde_json::to_string(&self).map_err(|_| libsql::Error::NullValue)?;
        Ok(Value::Text(serialized))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RequestType {
    Http,
    Websocket,
}

impl Display for RequestType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}",
            serde_json::to_string(&self).expect("serialization to always work")
        )
    }
}

impl IntoValue for RequestType {
    fn into_value(self) -> libsql::Result<Value> {
        let serialized = serde_json::to_string(&self).map_err(|_| libsql::Error::NullValue)?;
        Ok(Value::Text(serialized))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProbedRoutes {
    pub routes: Vec<ProbedRoute>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProbedRoute {
    pub method: String,
    pub path: String,
    pub handler: String,
    pub handler_type: String,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct HexEncodedId(String);

impl HexEncodedId {
    pub fn new(input: impl Into<String>) -> Result<HexEncodedId, hex::FromHexError> {
        let id = HexEncodedId(input.into());
        id.validate()?;

        Ok(id)
    }

    pub fn validate(&self) -> Result<(), hex::FromHexError> {
        hex::decode(&self.0).map(|_| ())
    }

    pub fn into_inner(self) -> String {
        self.0
    }

    pub fn as_inner(&self) -> &str {
        &self.0
    }
}

impl AsMut<str> for HexEncodedId {
    fn as_mut(&mut self) -> &mut str {
        &mut self.0
    }
}

impl From<HexEncodedId> for String {
    fn from(value: HexEncodedId) -> Self {
        value.0
    }
}

impl FromStr for HexEncodedId {
    type Err = hex::FromHexError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        HexEncodedId::new(s)
    }
}

impl Deref for HexEncodedId {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<Vec<u8>> for HexEncodedId {
    fn from(value: Vec<u8>) -> Self {
        // .unwrap() is safe because we literally encode it to hex in the exact same line
        Self::new(hex::encode(value)).unwrap()
    }
}

#[cfg(feature = "libsql")]
impl From<HexEncodedId> for libsql::Value {
    fn from(value: HexEncodedId) -> Self {
        value.into_inner().into()
    }
}

#[cfg(feature = "libsql")]
impl From<&HexEncodedId> for libsql::Value {
    fn from(value: &HexEncodedId) -> Self {
        value.as_inner().into()
    }
}

#[cfg(feature = "wasm-bindgen")]
impl From<HexEncodedId> for wasm_bindgen::JsValue {
    fn from(value: HexEncodedId) -> Self {
        (&value).into()
    }
}

#[cfg(feature = "wasm-bindgen")]
impl From<&HexEncodedId> for wasm_bindgen::JsValue {
    fn from(value: &HexEncodedId) -> Self {
        wasm_bindgen::JsValue::from_str(value.as_inner())
    }
}

struct HexEncodedIdVisitor;

impl<'de> Visitor<'de> for HexEncodedIdVisitor {
    type Value = HexEncodedId;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a hex-represented string")
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: Error,
    {
        HexEncodedId::new(v).map_err(Error::custom)
    }

    fn visit_borrowed_str<E>(self, v: &'de str) -> Result<Self::Value, E>
    where
        E: Error,
    {
        HexEncodedId::new(v).map_err(Error::custom)
    }

    fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
    where
        E: Error,
    {
        HexEncodedId::new(v).map_err(Error::custom)
    }
}

impl<'de> Deserialize<'de> for HexEncodedId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_string(HexEncodedIdVisitor)
    }
}
