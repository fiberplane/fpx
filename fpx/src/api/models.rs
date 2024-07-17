use crate::api::errors::{ApiError, ApiServerError, CommonError};
use crate::data::DbError;
use rand::Rng;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use thiserror::Error;

mod otel;

pub use otel::*;

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
    #[allow(dead_code)]
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
