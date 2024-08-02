use fpx_lib::data::fake_store::FakeStore;
use fpx_lib::events::ServerEvents;
use fpx_lib::{api, service};
use std::sync::{Arc, OnceLock};
use tower_service::Service;
use tracing::info;
use tracing_subscriber::fmt::format::Pretty;
use tracing_subscriber::fmt::time::UtcTime;
use tracing_subscriber::prelude::*;
use tracing_web::{performance_layer, MakeConsoleWriter};
use worker::*;

// https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/

static FAKE_STORE: OnceLock<FakeStore> = OnceLock::new();

#[event(start)]
fn start() {
    let fmt_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_ansi(false) // Only partially supported across JavaScript runtimes
        .with_timer(UtcTime::rfc_3339())
        .with_writer(MakeConsoleWriter); // write events to the console
    let perf_layer = performance_layer().with_details_from_fields(Pretty::default());
    tracing_subscriber::registry()
        .with(fmt_layer)
        .with(perf_layer)
        .init();

    FAKE_STORE
        .set(FakeStore::new())
        .expect("failed to set FakeStore");
}

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    console_error_panic_hook::set_once();

    // Should move into the router
    if req.uri().to_string().ends_with("/websocket") {
        let upgrade_header = req.headers().get("Upgrade");

        if let Some(value) = upgrade_header {
            if value != "websocket" {
                // Status 426
                return Ok(axum::http::Response::new(
                    "Durable Object expected Upgrade: websocket".into(),
                ));
            }

            let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
            let stub = ws.id_from_name("ws")?.get_stub()?;

            let response: axum::response::Response =
                stub.fetch_with_str("http://fake-host/").await?.into();

            return Ok(response);
        }
    }

    let store = FAKE_STORE.get().unwrap().clone();
    let boxed_store = Arc::new(store);
    let events = ServerEvents::new();

    let service = service::Service::new(boxed_store.clone(), events.clone());
    let mut router = api::create_api(events, service, boxed_store);

    info!("Request: {:?}", req);

    Ok(router.call(req).await?)
}

#[allow(dead_code)]
#[durable_object]
pub struct WebSocketHibernationServer {
    env: Env,
    state: State,
}

#[durable_object]
impl DurableObject for WebSocketHibernationServer {
    fn new(state: State, env: Env) -> Self {
        Self { env, state }
    }

    async fn fetch(&mut self, mut req: worker::Request) -> Result<Response> {
        let env = self.env.clone();

        Router::with_data(self)
            .get_async("/ws", websocket_connect)
            .run(req, env)
            .await
    }
}

async fn websocket_connect(
    _req: Request,
    ctx: RouteContext<&mut WebSocketHibernationServer>,
) -> Result<Response> {
    let WebSocketPair { client, server } = WebSocketPair::new()?;
    // TODO: Support hibernation, should probably be something like .acceptWebsocket(ws);
    // https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
    // server.accept()?;

    ctx.data.state.accept_web_socket(&server);

    let resp = Response::from_websocket(client)?;
    Ok(resp)
}
