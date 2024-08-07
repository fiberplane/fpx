use fpx_lib::api::models::ServerMessage;
use std::sync::Arc;
use wasm_bindgen_futures::wasm_bindgen::JsValue;
use worker::*;

pub struct WebSocketWorkerClient {
    stub: Stub,
}

impl WebSocketWorkerClient {
    pub fn new(env: &Arc<Env>) -> Self {
        let stub = get_ws_durable_object(env).expect("Durable Object not found");

        Self { stub }
    }

    pub async fn connect(&self) -> Result<Response> {
        let headers = Headers::from_iter([("Upgrade", "websocket")]);
        let req = Request::new_with_init(
            "http://fake-host/connect",
            RequestInit::new().with_headers(headers),
        )?;

        self.stub.fetch_with_request(req).await
    }

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

fn get_ws_durable_object(env: &Arc<Env>) -> Result<Stub> {
    let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
    let stub = ws.id_from_name("ws")?.get_stub()?;

    Ok(stub)
}
