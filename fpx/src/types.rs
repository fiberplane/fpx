use serde::{Deserialize, Serialize};

pub const FPX_WEBSOCKET_ID_HEADER: &'static str = "fpx-websocket-id";

/// Messages that are send from the server to the client.
#[derive(Clone, Serialize, Deserialize)]
pub enum ServerMessage {
    Ack,
    Error,
    Otel,
}

/// Messages that are send from the client to the server.
#[derive(Clone, Serialize, Deserialize)]
pub enum ClientMessage {
    Debug,
}
