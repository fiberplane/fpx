use axum::async_trait;
use axum::routing::{get, post};
use fpx_lib::api::models::ServerMessage;
use fpx_lib::data::fake_store::FakeStore;
use fpx_lib::events::ServerEvents;
use fpx_lib::{api, service};
use std::sync::{Arc, LazyLock};
use tower_service::Service;
use tracing_subscriber::fmt::format::Pretty;
use tracing_subscriber::fmt::time::UtcTime;
use tracing_subscriber::prelude::*;
use tracing_web::{performance_layer, MakeConsoleWriter};
use worker::send::SendFuture;
use worker::*;
use ws::client::WebSocketWorkerClient;
use ws::handlers::{ws_broadcast, ws_connect, WorkerApiState};

mod ws;

static FAKE_STORE: LazyLock<FakeStore> = LazyLock::new(FakeStore::default);

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
}

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    console_error_panic_hook::set_once();

    let env = Arc::new(env);

    let new_events = DurableObjectsEvents::new(env.clone());
    let events = Arc::new(new_events);

    let state = WorkerApiState { env };

    let store = FAKE_STORE.clone();
    let boxed_store = Arc::new(store);

    let service = service::Service::new(boxed_store.clone(), events.clone());
    let api_router = api::create_api(events, service, boxed_store);

    let mut router: axum::Router = axum::Router::new()
        .route("/api/ws", get(ws_connect))
        .route("/api/ws/broadcast", post(ws_broadcast))
        .with_state(state)
        .nest_service("/", api_router);

    Ok(router.call(req).await?)
}

#[derive(Clone)]
struct DurableObjectsEvents {
    env: Arc<Env>,
}

impl DurableObjectsEvents {
    fn new(env: Arc<Env>) -> Self {
        Self { env }
    }
}

#[async_trait]
impl ServerEvents for DurableObjectsEvents {
    async fn broadcast(&self, msg: ServerMessage) {
        SendFuture::new(async {
            WebSocketWorkerClient::new(&self.env)
                .broadcast(msg)
                .await
                .unwrap();
        })
        .await
    }
}
