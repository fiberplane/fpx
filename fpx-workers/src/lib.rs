use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use fpx_lib::data::fake_store::FakeStore;
use fpx_lib::events::ServerEvents;
use fpx_lib::{api, service};
use std::sync::{Arc, LazyLock};
use tower_service::Service;
use tracing_subscriber::fmt::format::Pretty;
use tracing_subscriber::fmt::time::UtcTime;
use tracing_subscriber::prelude::*;
use tracing_web::{performance_layer, MakeConsoleWriter};
use worker::*;
use ws::BroadcastPayload;
mod ws;

static FAKE_STORE: LazyLock<FakeStore> = LazyLock::new(FakeStore::default);

#[derive(Clone)]
struct ApiState {
    env: Arc<Env>,
}

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

    let state = ApiState { env: Arc::new(env) };

    let store = FAKE_STORE.clone();
    let boxed_store = Arc::new(store);
    let events = ServerEvents::new();

    let service = service::Service::new(boxed_store.clone(), events.clone());
    let api_router = api::create_api(events, service, boxed_store);

    let mut router: axum::Router = axum::Router::new()
        .route("/api/ws", get(ws_connect))
        .route("/api/ws/broadcast", post(ws_broadcast))
        .with_state(state)
        .nest_service("/", api_router);

    Ok(router.call(req).await?)
}

#[axum::debug_handler]
#[worker::send]
async fn ws_connect(
    axum::extract::State(state): axum::extract::State<ApiState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(value) = headers.get("Upgrade") {
        if value == "websocket" {
            let mut req =
                worker::Request::new("http://fake-host/connect", worker::Method::Get).unwrap();

            req.headers_mut()
                .unwrap()
                .set("Upgrade", "websocket")
                .unwrap();

            let res: axum::http::Response<_> = get_ws_server(state.env)
                .unwrap()
                .fetch_with_request(req)
                .await
                .unwrap()
                .into();

            return res;
        }
    }

    axum::http::Response::builder()
        .status(axum::http::StatusCode::UPGRADE_REQUIRED)
        .body(axum::body::Body::from(
            "Durable Object expected Upgrade: websocket",
        ))
        .unwrap()
}

#[axum::debug_handler]
#[worker::send]
async fn ws_broadcast(
    axum::extract::State(state): axum::extract::State<ApiState>,
    axum::extract::Json(payload): axum::extract::Json<BroadcastPayload>,
) -> impl IntoResponse {
    let payload = serde_json::to_string(&payload).unwrap();

    let req = axum::http::Request::builder()
        .uri("http://fake-host/broadcast")
        .method("POST")
        .body(payload)
        .unwrap();

    let req = worker::Request::try_from(req).unwrap();

    let res: axum::response::Response = get_ws_server(state.env)
        .unwrap()
        .fetch_with_request(req)
        .await
        .unwrap()
        .into();

    res
}

fn get_ws_server(env: Arc<Env>) -> Result<Stub> {
    let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
    let stub = ws.id_from_name("ws")?.get_stub()?;

    Ok(stub)
}
