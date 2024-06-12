use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const FPX_WEBSOCKET_ID_HEADER: &str = "fpx-websocket-id";

/// Messages that are send from the server to the client.
#[derive(Clone, Serialize, Deserialize)]
pub enum ServerMessage {
    Ack,
    Error,
    Otel,

    /// A request has been captured. It contains a reference to the request id
    /// and optionally a reference to the inspector id.
    RequestAdded(Box<RequestAdded>),
}

#[derive(Clone, Serialize, Deserialize)]
pub struct RequestAdded {
    /// The id of the request that has been captured.
    request_id: i64,

    /// The id of the inspector that was associated with the request. This is
    /// null in the case where the request was send to `/api/inspect`.
    inspector_id: Option<i64>,
}

impl RequestAdded {
    pub fn new(request_id: i64, inspector_id: Option<i64>) -> Self {
        Self {
            request_id,
            inspector_id,
        }
    }
}

impl Into<ServerMessage> for RequestAdded {
    fn into(self) -> ServerMessage {
        ServerMessage::RequestAdded(Box::new(self))
    }
}

/// Messages that are send from the client to the server.
#[derive(Clone, Serialize, Deserialize)]
pub enum ClientMessage {
    Debug,
}

/// A request that has been captured by fpx.
#[derive(Clone, Serialize, Deserialize)]
pub struct Request {
    pub id: i64,
    pub method: String,
    pub url: String,
    pub headers: BTreeMap<String, String>,
    pub body: Option<String>,
}

impl Request {
    pub fn new(
        id: i64,
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
