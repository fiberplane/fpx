use std::{collections::BTreeMap, str::FromStr};

use axum::{extract::State, response::IntoResponse, Json};
use http::{HeaderMap, HeaderName, HeaderValue, StatusCode};
use serde::{Deserialize, Serialize};

use crate::data::Store;

#[derive(Deserialize, Serialize)]
pub enum HttpMethod {
    GET,
    // POST,
    // PATCH,
    // DELETE,
}

#[derive(Deserialize, Serialize)]
pub struct Request {
    method: HttpMethod,
    url: String,
    body: String,
    headers: BTreeMap<String, String>,
}

#[derive(Serialize)]
pub struct Response {
    status: u32,
    headers: BTreeMap<String, String>,
    body: Option<String>,
}

pub async fn execute_requestor(
    State(store): State<Store>,
    Json(payload): Json<Request>,
) -> impl IntoResponse {
    let client = reqwest::Client::new();

    let tx = store.start_transaction().await.unwrap();

    let mut request_headers = HeaderMap::new();

    for (key, val) in payload.headers.iter() {
        let header_name = HeaderName::from_str(key.as_str()).unwrap();
        let header_value = HeaderValue::from_str(val.as_str()).unwrap();
        request_headers.insert(header_name, header_value);
    }

    match payload.method {
        HttpMethod::GET => {
            let response = client
                .get(payload.url.clone())
                .body(payload.body.clone())
                .headers(request_headers)
                .send()
                .await
                .unwrap();

            let request_id =
                Store::request_create(&tx, "GET", &payload.url, &payload.body, payload.headers)
                    .await
                    .unwrap();

            tx.commit().await.unwrap();

            println!("Created GET request with id: {}", request_id);

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
                status,
                headers: response_header_map,
                body: Some(body.to_owned()),
            })
        } // RequestorMethod::POST => {
          //     let body = client
          //         .post(payload.url.clone())
          //         .body(payload.body.clone())
          //         .headers(headers)
          //         .send()
          //         .await
          //         .unwrap()
          //         .text()
          //         .await
          //         .unwrap();
          //
          //     let request_id =
          //         Store::request_create(&tx, "POST", &payload.url, &payload.body, payload.headers)
          //             .await
          //             .unwrap();
          //
          //     tx.commit().await.unwrap();
          //
          //     println!("Created POST request with id: {}", request_id);
          //
          //     Json(body)
          // }
          // RequestorMethod::PATCH => {}
          // RequestorMethod::DELETE => {}
    }
}
