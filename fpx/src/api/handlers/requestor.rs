use std::{collections::BTreeMap, str::FromStr};

use axum::{extract::State, response::IntoResponse, Json};
use http::{HeaderMap, HeaderName, HeaderValue, StatusCode};
use reqwest::RequestBuilder;
use serde::{Deserialize, Serialize};

use crate::data::Store;

#[derive(Deserialize, Serialize)]
pub struct Request {
    method: HttpMethod,
    url: String,
    body: Option<String>,
    headers: BTreeMap<String, String>,
}

#[derive(Clone, Copy, Deserialize, Serialize)]
pub enum HttpMethod {
    GET,
    POST,
    PATCH,
    DELETE,
}

impl Into<String> for HttpMethod {
    fn into(self) -> String {
        match self {
            HttpMethod::GET => String::from("GET"),
            HttpMethod::POST => String::from("POST"),
            HttpMethod::PATCH => String::from("PATCH"),
            HttpMethod::DELETE => String::from("DELETE"),
        }
    }
}

#[derive(Serialize)]
pub struct Response {
    request_id: i64,
    status: i64,
    headers: BTreeMap<String, String>,
    body: Option<String>,
}

pub async fn execute_requestor(
    State(store): State<Store>,
    Json(payload): Json<Request>,
) -> impl IntoResponse {
    let tx = store.start_transaction().await.unwrap();

    let mut request_headers = HeaderMap::new();

    for (key, val) in payload.headers.iter() {
        let header_name = HeaderName::from_str(key.as_str()).unwrap();
        let header_value = HeaderValue::from_str(val.as_str()).unwrap();
        request_headers.insert(header_name, header_value);
    }

    let request = build_request(
        &payload.method,
        &payload.url,
        &payload.body,
        &request_headers,
    );

    let response = request.send().await.unwrap();

    let method: String = payload.method.into();
    // TODO: Store should probably support optional bodies
    let body = payload.body.unwrap_or(String::from(""));

    let request_id =
        Store::request_create(&tx, method.as_str(), &payload.url, &body, payload.headers)
            .await
            .unwrap();

    tx.commit().await.unwrap();

    println!("Created {} request with id: {}", method, request_id);

    let response_headers = &response.headers();
    let mut response_header_map: BTreeMap<String, String> = BTreeMap::new();
    for (key, val) in response_headers.iter() {
        response_header_map.insert(key.to_string(), String::from(val.to_str().unwrap()));
    }

    let status = match response.status() {
        StatusCode::OK => 200,
        _ => 0,
    };

    let body = &response.text().await.unwrap();

    Json(Response {
        request_id,
        status,
        headers: response_header_map,
        body: Some(body.to_owned()),
    })
}

fn build_request(
    method: &HttpMethod,
    url: &str,
    body: &Option<String>,
    headers: &HeaderMap,
) -> RequestBuilder {
    let client = reqwest::Client::new();

    let handler = match method {
        HttpMethod::GET => client.get(url),
        HttpMethod::POST => client.post(url),
        HttpMethod::PATCH => client.patch(url),
        HttpMethod::DELETE => client.delete(url),
    };

    let handler = match body {
        Some(body) => handler.body(body.clone()),
        None => handler,
    };

    handler.headers(headers.clone())
}
