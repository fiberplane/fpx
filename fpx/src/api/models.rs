use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

mod otel;
pub mod settings;

pub use otel::*;

/// The header that will be returned on the initial websocket connection. This
/// could be useful for debugging purposes.
pub const FPX_WEBSOCKET_ID_HEADER: &str = "fpx-websocket-id";

/// Messages that are send from the server to the client.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
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

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
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

    /// When a Span has been ingested via the export interface (either gRPC or
    /// http), its TraceID and SpanID will be sent through this message. Both
    /// ID's will be hex encoded.
    SpanAdded(Box<SpanAdded>),
}

impl From<ServerMessageDetails> for ServerMessage {
    fn from(value: ServerMessageDetails) -> Self {
        Self::new(value)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum ServerError {
    /// A message was received that could not be parsed.
    InvalidMessage,
}

/// Messages that are send from the client to the server.
#[derive(Clone, Serialize, Deserialize, JsonSchema)]
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
        // let mut rng = rand::thread_rng();
        let message_id: u32 = 1; // TODO: Probably can't use random, due to wasm
                                 // restriction

        Self {
            message_id: message_id.to_string(),
            details,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "type", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum ClientMessageDetails {
    Debug,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
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
