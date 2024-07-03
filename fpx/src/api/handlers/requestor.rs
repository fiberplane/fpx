use anyhow::Error;
use std::{collections::BTreeMap, str::FromStr};

use axum::{extract::State, response::IntoResponse, Json};
use http::{HeaderMap, HeaderName, HeaderValue, Method, StatusCode};
use serde::Serialize;
use thiserror::Error;

use crate::{
    api::errors::ApiServerError,
    data::{DbError, Store},
    models,
};

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

    reqwest::Client::new()
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

#[derive(Debug, Serialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[allow(dead_code)]
pub enum RequestorError {
    #[error("failed to handle request: {0:?}")]
    Internal(
        #[serde(skip_serializing)]
        #[from]
        anyhow::Error,
    ),
    #[error("database error: {0:?}")]
    DbError(
        #[serde(skip_serializing)]
        #[from]
        DbError,
    ),
    #[error("libsql error: {0:?}")]
    LibsqlError(
        #[serde(skip_serializing)]
        #[from]
        libsql::Error,
    ),
    #[error("Request error: {0:?}")]
    RequestError(
        #[serde(skip_serializing)]
        #[from]
        reqwest::Error,
    ),
}

impl IntoResponse for RequestorError {
    fn into_response(self) -> axum::response::Response {
        let status = StatusCode::INTERNAL_SERVER_ERROR;
        let body = serde_json::to_vec(&self).expect("test");

        (status, body).into_response()
    }
}

impl From<DbError> for ApiServerError<RequestorError> {
    fn from(err: DbError) -> Self {
        ApiServerError::ServiceError(RequestorError::DbError(err))
    }
}

impl From<Error> for ApiServerError<RequestorError> {
    fn from(err: Error) -> Self {
        ApiServerError::ServiceError(RequestorError::Internal(err))
    }
}

impl From<libsql::Error> for ApiServerError<RequestorError> {
    fn from(err: libsql::Error) -> Self {
        ApiServerError::ServiceError(RequestorError::LibsqlError(err))
    }
}

impl From<reqwest::Error> for ApiServerError<RequestorError> {
    fn from(err: reqwest::Error) -> Self {
        ApiServerError::ServiceError(RequestorError::RequestError(err))
    }
}
