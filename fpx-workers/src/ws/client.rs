use fpx_lib::api::models::ServerMessage;
use std::sync::Arc;
use wasm_bindgen_futures::wasm_bindgen::JsValue;
use worker::*;

/// A client for communicating with the hibernating WebSocket Durable Object worker.
///
/// This client provides methods to connect to the WebSocket server and to broadcast messages
/// to all connected WebSocket clients via the Durable Object worker.
pub struct WebSocketWorkerClient {
    stub: Stub,
}

impl WebSocketWorkerClient {
    pub fn new(env: &Arc<Env>) -> Self {
        let stub = get_ws_durable_object(env).expect("Durable Object not found");

        Self { stub }
    }

    /// Sends a connection request to the Durable Object to establish a WebSocket connection.
    ///
    /// This method creates an HTTP request with the `Upgrade` header set to `websocket`, which
    /// instructs the server to switch protocols to WebSocket.
    pub async fn connect(&self) -> Result<Response> {
        let headers = Headers::from_iter([("Upgrade", "websocket")]);
        let req = Request::new_with_init(
            "http://fake-host/connect",
            RequestInit::new().with_headers(headers),
        )?;

        self.stub.fetch_with_request(req).await
    }

    /// Sends a broadcast request to the Durable Object to broadcast a message to all connected clients.
    ///
    /// This method serializes the provided `ServerMessage` payload to JSON, converts it to a
    /// `JsValue`, and sends it in the body of a POST request to the `/broadcast` endpoint of the
    /// worker.
    pub async fn broadcast(&self, payload: ServerMessage) -> Result<Response> {
        let serialized = serde_json::to_string(&payload)?;

        let payload = JsValue::try_from(serialized)?;

        let req = Request::new_with_init(
            "http://fake-host/broadcast",
            RequestInit::new()
                .with_body(Some(payload))
                .with_method(Method::Post)
                .with_redirect(RequestRedirect::Manual),
        )?;

        self.stub.fetch_with_request(req).await
    }
}

/// Retrieves the Durable Object that contains the WebSocket server from the environment.
///
/// This function looks up the Durable Object using the provided environment, retrieves its
/// identifier by name, and gets a stub for communicating with it.
fn get_ws_durable_object(env: &Arc<Env>) -> Result<Stub> {
    let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
    let stub = ws.id_from_name("ws")?.get_stub()?;

    Ok(stub)
}
