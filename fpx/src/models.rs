use crate::api::errors::{ApiError, ApiServerError, CommonError};
use crate::data::{self, models::AttributeMap, DbError, Json};
use opentelemetry_proto::tonic::trace::v1::span;
use rand::Rng;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use strum::AsRefStr;
use thiserror::Error;

pub const FPX_WEBSOCKET_ID_HEADER: &str = "fpx-websocket-id";

/// Messages that are send from the server to the client.
#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerMessage {
    /// If this is a response to a client message, then this field contains the
    /// same message id. Otherwise it will be [`None`].
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_id: Option<String>,

    #[serde(flatten)]
    pub details: ServerMessageDetails,
}

impl ServerMessage {
    /// Create a new server message. This will not set a message id, use
    /// [`Self::reply`] for that.
    pub fn new(details: ServerMessageDetails) -> Self {
        Self {
            message_id: None,
            details,
        }
    }

    pub fn ack(message_id: String) -> Self {
        Self::reply(message_id, ServerMessageDetails::Ack)
    }

    pub fn error(message_id: Option<String>, err: ServerError) -> Self {
        Self {
            message_id,
            details: ServerMessageDetails::Error(err),
        }
    }

    /// Create a new server message with a message id. This is used to reply to
    /// a specific client message.
    pub fn reply(message_id: String, details: ServerMessageDetails) -> Self {
        Self {
            message_id: Some(message_id),
            details,
        }
    }
}

#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum ServerMessageDetails {
    /// A message was received and processed successfully. See the outer message
    /// for the message id.
    Ack,

    /// An error occurred on the server. This could be caused by a message or
    /// could be caused by something else. See the outer message for the message
    /// id.
    Error(ServerError),

    /// A request has been captured. It contains a reference to the request id
    /// and optionally a reference to the inspector id.
    RequestAdded(Box<RequestAdded>),

    SpanAdded(Box<SpanAdded>),
}

impl From<ServerMessageDetails> for ServerMessage {
    fn from(value: ServerMessageDetails) -> Self {
        Self::new(value)
    }
}

#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum ServerError {
    /// A message was received that could not be parsed.
    InvalidMessage,
}

/// Messages that are send from the client to the server.
#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientMessage {
    /// A unique identifier for this message. This will be used by certain
    /// server messages to refer back to this message, such as Ack or Error.
    pub message_id: String,

    #[serde(flatten)]
    pub details: ClientMessageDetails,
}

impl ClientMessage {
    /// Create a new client message with a random message id (u32).
    #[allow(dead_code)] // Required since we do not send any messages
    pub fn new(details: ClientMessageDetails) -> Self {
        let mut rng = rand::thread_rng();
        let message_id: u32 = rng.gen();

        Self {
            message_id: message_id.to_string(),
            details,
        }
    }
}

#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum ClientMessageDetails {
    Debug,
}

#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestAdded {
    /// The id of the request that has been captured.
    request_id: u32,

    /// The id of the inspector that was associated with the request. This is
    /// null in the case where the request was send to `/api/inspect`.
    #[serde(skip_serializing_if = "Option::is_none")]
    inspector_id: Option<i64>,
}

impl RequestAdded {
    pub fn new(request_id: u32, inspector_id: Option<i64>) -> Self {
        Self {
            request_id,
            inspector_id,
        }
    }
}

impl From<RequestAdded> for ServerMessage {
    fn from(val: RequestAdded) -> Self {
        ServerMessageDetails::RequestAdded(Box::new(val)).into()
    }
}

#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpanAdded {
    /// New spans that have been added. The key is the trace ID and the values
    /// are the spans ID's for that specific trace. Both trace and span ID are
    /// hex encoded.
    new_spans: Vec<(String, String)>,
}

impl SpanAdded {
    pub fn new(new_spans: Vec<(String, String)>) -> Self {
        Self { new_spans }
    }
}

impl From<SpanAdded> for ServerMessage {
    fn from(val: SpanAdded) -> Self {
        ServerMessageDetails::SpanAdded(Box::new(val)).into()
    }
}

/// A request that has been captured by fpx.
#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    pub id: u32,
    pub method: String,
    pub url: String,
    pub body: Option<String>,
    pub headers: BTreeMap<String, String>,
}

impl Request {
    pub fn new(
        id: u32,
        method: String,
        url: String,
        body: String,
        headers: BTreeMap<String, String>,
    ) -> Self {
        Self {
            id,
            method,
            url,
            headers,
            body: Some(body),
        }
    }
}

/// A response that has been captured by fpx.
#[derive(JsonSchema, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    pub id: u32,
    pub status: u16,
    pub url: String,
    pub body: Option<String>,
    pub headers: BTreeMap<String, String>,
}

impl Response {
    pub fn new(
        id: u32,
        status: u16,
        url: String,
        body: String,
        headers: BTreeMap<String, String>,
    ) -> Self {
        Self {
            id,
            status,
            url,
            headers,
            body: Some(body),
        }
    }
}

/// The payload that describes the request that Requestor has to execute
#[derive(JsonSchema, Deserialize, Serialize)]
pub struct RequestorRequestPayload {
    pub method: String,
    pub url: String,
    pub body: Option<String>,
    pub headers: Option<BTreeMap<String, String>>,
}

// TODO: Improve later to get more specific error handling
#[derive(JsonSchema, Debug, Serialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[allow(dead_code)]
pub enum RequestorError {}

impl ApiError for RequestorError {
    fn status_code(&self) -> http::StatusCode {
        // NOTE: RequestorError doesn't have any explicit errors, so just
        // return a NOT_IMPLEMENTED status code for now.
        http::StatusCode::NOT_IMPLEMENTED
    }
}

impl From<DbError> for ApiServerError<RequestorError> {
    fn from(_err: DbError) -> Self {
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

impl From<libsql::Error> for ApiServerError<RequestorError> {
    fn from(_err: libsql::Error) -> Self {
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

impl From<reqwest::Error> for ApiServerError<RequestorError> {
    fn from(_err: reqwest::Error) -> Self {
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

pub struct ResourceSpans {
    pub resource: Resource,
    pub scope_spans: Vec<ScopeSpans>,
    pub schema_url: Option<String>,
}

pub struct Resource {
    pub attributes: BTreeMap<String, String>,
    pub dropped_attributes_count: u32,
}

pub struct ScopeSpans {
    pub instrumentation_scope: InstrumentationScope,
    pub spans: Vec<Span>,
    pub schema_url: Option<String>,
}

pub struct InstrumentationScope {
    pub name: Option<String>,
    pub version: Option<String>,
    pub attributes: BTreeMap<String, String>,
    pub dropped_attributes_count: u32,
}

#[derive(Deserialize, Serialize)]
pub struct Span {
    pub trace_id: String,
    pub span_id: String,
    pub parent_span_id: Option<String>,

    pub name: String,
    pub state: String,
    pub kind: SpanKind,

    #[serde(with = "time::serde::rfc3339")]
    pub start_time: time::OffsetDateTime,

    #[serde(with = "time::serde::rfc3339")]
    pub end_time: time::OffsetDateTime,

    pub attributes: AttributeMap,
    pub scope_attributes: Option<AttributeMap>,
    pub resource_attributes: Option<AttributeMap>,
}

impl From<data::models::Span> for Span {
    fn from(span: data::models::Span) -> Self {
        let trace_id = hex::encode(span.trace_id);
        let span_id = hex::encode(span.span_id);
        let parent_span_id = span.parent_span_id.map(hex::encode);

        Self {
            trace_id,
            span_id,
            parent_span_id,
            name: span.name,
            state: span.state,
            kind: span.kind,
            start_time: span.start_time.into(),
            end_time: span.end_time.into(),
            attributes: span.attributes.into_inner(),
            scope_attributes: span.scope_attributes.map(Json::into_inner),
            resource_attributes: span.resource_attributes.map(Json::into_inner),
        }
    }
}

#[derive(AsRefStr, Serialize, Deserialize, PartialEq, Debug)]
pub enum SpanKind {
    Internal,
    Server,
    Client,
    Producer,
    Consumer,
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

pub struct Event {
    pub time_unix_nano: u64,
    pub name: String,
    pub attributes: BTreeMap<String, String>,
    pub dropped_attributes_count: u32,
}

pub struct Link {
    pub trace_id: Vec<u8>,
    pub span_id: Vec<u8>,
    pub trace_state: Option<String>,
    pub attributes: BTreeMap<String, String>,
    pub dropped_attributes_count: u32,
    pub flags: u16,
}

pub struct Status {
    pub code: StatusCode,
    pub message: String,
}

pub enum StatusCode {
    Unset,
    Ok,
    Error,
}
