use super::worker::BroadcastPayload;
use std::sync::Arc;
use wasm_bindgen_futures::wasm_bindgen::JsValue;
use worker::*;

pub struct WebSocketWorkerClient {
    stub: Stub,
}

impl WebSocketWorkerClient {
    pub fn new(env: Arc<Env>) -> Self {
        let stub = get_ws_durable_object(env).unwrap();

        Self { stub }
    }

    pub async fn connect(&self) -> Response {
        let mut req = Request::new("http://fake-host/connect", Method::Get).unwrap();

        req.headers_mut()
            .unwrap()
            .set("Upgrade", "websocket")
            .unwrap();

        self.stub.fetch_with_request(req).await.unwrap()
    }

    pub async fn broadcast(&self, payload: BroadcastPayload) -> Response {
        let payload = serde_json::to_string(&payload).unwrap();

        let payload = JsValue::try_from(payload).unwrap();

        let req = Request::new_with_init(
            "http://fake-host/broadcast",
            &RequestInit {
                body: Some(payload),
                headers: Headers::new(),
                cf: CfProperties::new(),
                method: Method::Post,
                redirect: RequestRedirect::Manual,
            },
        )
        .unwrap();

        self.stub.fetch_with_request(req).await.unwrap()
    }
}

fn get_ws_durable_object(env: Arc<Env>) -> Result<Stub> {
    let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
    let stub = ws.id_from_name("ws")?.get_stub()?;

    Ok(stub)
}
