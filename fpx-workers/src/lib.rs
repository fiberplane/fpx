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
    _env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    console_error_panic_hook::set_once();

    let store = FAKE_STORE.clone();
    let boxed_store = Arc::new(store);
    let events = ServerEvents::new();

    let service = service::Service::new(boxed_store.clone(), events.clone());
    let mut router = api::create_api(events, service, boxed_store);

    Ok(router.call(req).await?)
}
