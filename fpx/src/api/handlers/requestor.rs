use crate::api::errors::ApiServerError;
use crate::data::Store;
use crate::models::{self, RequestorError};
use axum::{extract::State, Json};
use http::{HeaderMap, HeaderName, HeaderValue, Method};
use once_cell::sync::Lazy;
use reqwest::redirect::{Action, Attempt, Policy};
use reqwest::Client;
use std::{collections::BTreeMap, str::FromStr, time::Duration};

static REQUESTOR_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .no_gzip()
        .connect_timeout(Duration::from_secs(30))
        .user_agent("FPX Requestor")
        .redirect(Policy::custom(redirect_policy))
        .http1_only()
        .build()
        .expect("failed to initialize requestor client")
});

#[tracing::instrument(skip_all)]
pub async fn execute_requestor(
    State(store): State<Store>,
    Json(payload): Json<models::RequestorRequestPayload>,
) -> Result<Json<models::Response>, ApiServerError<RequestorError>> {
    let tx = store.start_transaction().await?;

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
    .await?;

    tx.commit().await?;

    let response = request.await?;

    let response_headers = prepare_headers(response.headers());
    let response_status = response.status().as_u16();
    let response_body = &response.text().await?;

    Ok(Json(models::Response {
        id: request_id,
        status: response_status,
        headers: response_headers,
        body: Some(response_body.to_owned()),
        url: payload.url,
    }))
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

    REQUESTOR_CLIENT
        .request(request_method, url)
        .headers(header_map)
        .body(body)
        .send()
        .await
}

fn prepare_headers(header_map: &HeaderMap) -> BTreeMap<String, String> {
    let mut response_header_map: BTreeMap<String, String> = BTreeMap::new();

    for (key, val) in header_map.iter() {
        response_header_map.insert(key.to_string(), String::from(val.to_str().unwrap()));
    }

    response_header_map
}

fn redirect_policy(attempt: Attempt) -> Action {
    let attempts = attempt.previous().len();

    if attempts > 5 {
        return attempt.error("exceeded max redirect depth of 5");
    }

    attempt.follow()
}
