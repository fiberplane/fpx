use std::{collections::BTreeMap, str::FromStr};

use axum::{extract::State, response::IntoResponse, Json};
use http::{HeaderMap, HeaderName, HeaderValue, Method};

use crate::{
    data::Store,
    models::{RequestorRequestPayload, Response},
};

#[tracing::instrument(skip_all)]
pub async fn execute_requestor(
    State(store): State<Store>,
    Json(payload): Json<RequestorRequestPayload>,
) -> impl IntoResponse {
    let tx = store.start_transaction().await.unwrap(); // TODO

    let request_body = payload.body.unwrap_or_default();
    let request_headers = payload.headers.unwrap_or_default();

    let request = handle_request(
        &payload.method,
        &payload.url,
        &request_headers,
        request_body.clone(),
    );

    let request_id = Store::request_create(
        &tx,
        payload.method.as_str(),
        &payload.url,
        &request_body,
        request_headers.clone(),
    )
    .await
    .unwrap(); // TODO

    tx.commit().await.unwrap(); // TODO

    let response = request.await.unwrap(); // TODO

    let response_headers = &response.headers();
    let mut response_header_map: BTreeMap<String, String> = BTreeMap::new();
    for (key, val) in response_headers.iter() {
        response_header_map.insert(key.to_string(), String::from(val.to_str().unwrap()));
    }

    let response_status = response.status().as_u16();
    let response_body = &response.text().await.unwrap(); // TODO

    Json(Response {
        id: request_id,
        status: response_status,
        headers: response_header_map,
        body: Some(response_body.to_owned()),
        url: payload.url,
    })
}

async fn handle_request(
    request_method: &String,
    url: &String,
    headers: &BTreeMap<String, String>,
    body: String,
) -> Result<reqwest::Response, reqwest::Error> {
    let request_method: Method = Method::from_bytes(request_method.as_bytes()).unwrap(); // TODO

    let mut header_map = HeaderMap::new();

    for (key, val) in headers.iter() {
        if let Ok(header_name) = HeaderName::from_str(key.as_str()) {
            if let Ok(header_value) = HeaderValue::from_bytes(val.as_bytes()) {
                header_map.insert(header_name, header_value);
            }
        }
    }

    reqwest::Client::new()
        .request(request_method, url)
        .headers(header_map)
        .body(body)
        .send()
        .await
}
