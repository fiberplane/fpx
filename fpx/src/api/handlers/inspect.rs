use super::ApiState;
use crate::api::types;
use crate::data::libsql::LibSqlStore;
use axum::extract::Request;
use axum::extract::State;
use axum::response::IntoResponse;
use http_body_util::BodyExt as _;
use std::collections::BTreeMap;

#[tracing::instrument(skip_all)]
pub async fn inspect_request_handler(
    State(ApiState {
        base_url,
        events,
        store,
        ..
    }): State<ApiState>,
    req: Request,
) -> impl IntoResponse {
    let (parts, body) = req.into_parts();

    eprintln!("Method: {}", parts.method);
    eprintln!("URL: {}", parts.uri);

    eprintln!("Headers:");
    parts.headers.iter().for_each(|(key, value)| {
        eprintln!("- {}: {}", key, value.to_str().unwrap());
    });

    eprintln!();

    eprintln!("Body:");
    let body = body.collect().await.unwrap().to_bytes(); // TODO: handle error
    eprintln!("{:?}", body);
    eprintln!();

    let tx = store.start_transaction().await.unwrap(); // TODO

    let headers: BTreeMap<String, String> = parts
        .headers
        .iter()
        .map(|(key, value)| {
            (
                key.as_str().to_string(),
                value.to_str().unwrap().to_string(),
            )
        })
        .collect();
    let request_id: i64 = LibSqlStore::request_create(
        &tx,
        parts.method.as_ref(),
        &parts.uri.to_string(),
        &String::from_utf8(body.to_vec()).unwrap(),
        headers,
    )
    .await
    .unwrap(); // TODO

    tx.commit().await.unwrap(); // TODO

    events.broadcast(types::RequestAdded::new(request_id, None).into());

    // TODO: This should return the same payload as the GET /requests/{id} endpoint
    base_url
        .join(&format!("api/requests/{}", request_id))
        .unwrap()
        .to_string()
}
