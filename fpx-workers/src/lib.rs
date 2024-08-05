use data::D1Store;
use fpx_lib::events::ServerEvents;
use fpx_lib::{api, service};
use tower_service::Service;
use tracing_subscriber::fmt::format::Pretty;
use tracing_subscriber::fmt::time::UtcTime;
use tracing_subscriber::prelude::*;
use tracing_web::{performance_layer, MakeConsoleWriter};
use worker::*;

mod data;

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

    let d1_database = env.d1("DB").expect("unable to create a database");

    let store = D1Store::new(d1_database);
    let events = ServerEvents::new();

    let service = service::Service::new(store.clone(), events.clone());
    let mut router = api::create_api(events, service, store);

    Ok(router.call(req).await?)
}
