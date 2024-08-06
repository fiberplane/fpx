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
    // Should move into the router
    if req.uri().to_string().ends_with("/api/ws") {
        let upgrade_header = req.headers().get("Upgrade");

        if let Some(value) = upgrade_header {
            if value != "websocket" {
                // Should set status 426
                return Ok(axum::http::Response::new(
                    "Durable Object expected Upgrade: websocket".into(),
                ));
            }

            let mut request =
                worker::Request::new("http://fake-host/connect", worker::Method::Get)?;

            request.headers_mut()?.set("Upgrade", "websocket")?;

            let response: axum::response::Response = get_ws_server(env)?
                .fetch_with_request(request)
                .await?
                .into();

            return Ok(response);
        }
    }
    // Should move into the router
    if req.uri().to_string().ends_with("/api/ws/broadcast")
        && req.method() == axum::http::Method::POST
    {
        let body = req.into_body();

        let request = axum::http::Request::builder()
            .uri("http://fake-host/broadcast")
            .method("POST")
            .body(body)?;

        let request = worker::Request::try_from(request)?;

        let response: axum::response::Response = get_ws_server(env)?
            .fetch_with_request(request)
            .await?
            .into();

        return Ok(response);
    }

    let store = FAKE_STORE.clone();
    let boxed_store = Arc::new(store);
    let events = ServerEvents::new();

    let service = service::Service::new(boxed_store.clone(), events.clone());
    let mut router = api::create_api(events, service, boxed_store);

    Ok(router.call(req).await?)
}

fn get_ws_server(env: Env) -> Result<Stub> {
    let ws = env.durable_object("WEBSOCKET_HIBERNATION_SERVER")?;
    let stub = ws.id_from_name("ws")?.get_stub()?;

    Ok(stub)
}
