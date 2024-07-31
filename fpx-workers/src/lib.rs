use std::sync::Arc;
use tower_service::Service;
use worker::*;

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    _env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    console_error_panic_hook::set_once();

    let events = fpx_lib::events::ServerEvents::new();
    let service = fpx_lib::service::Service {};
    let store = fpx_lib::data::FakeStore {};

    let mut router = fpx_lib::api::create_api(events, service, Arc::new(store));

    Ok(router.call(req).await?)
}
