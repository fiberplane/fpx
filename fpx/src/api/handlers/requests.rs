use std::{collections::BTreeMap, str::FromStr, time::Duration};

use crate::api::errors::{ApiError, ApiServerError, CommonError};
use crate::api::models::{self, NewRequest, NewRequestError, RequestWithResponse, Response};
use crate::data::{DbError, Store};
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::Json;
use fpx_macros::ApiError;
use http::{HeaderMap, HeaderName, HeaderValue, Method, StatusCode};
use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;

static REQUEST_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .connect_timeout(Duration::from_secs(30))
        .user_agent("FPX Requestor")
        .build()
        .expect("failed to initialize requestor client")
});

pub async fn requests_post_handler(
    State(store): State<Store>,
    Json(payload): Json<NewRequest>,
) -> Result<Json<RequestWithResponse>, ApiServerError<NewRequestError>> {
    let tx = store.start_readwrite_transaction().await?;

    let request_body: Option<&str> = payload.body.as_deref();

    let request_headers = payload.headers.unwrap_or_default();

    let request = execute_request(
        &payload.method,
        &payload.url,
        request_body,
        &request_headers,
    );

    let request_model = Store::request_create(
        &tx,
        payload.method.as_str(),
        &payload.url,
        request_body,
        request_headers.clone(),
    )
    .await?;

    let response = request.await?;

    let response_headers = prepare_headers(response.headers());
    let response_status = response.status().as_u16();
    let response_body = &response.text().await?;
    let response_body = if response_body.is_empty() {
        None
    } else {
        Some(response_body.clone())
    };

    let response_model = Store::response_create(
        &tx,
        request_model.id,
        response_status,
        response_headers,
        response_body,
    )
    .await?;

    store.commit_transaction(tx).await?;

    Ok(Json(RequestWithResponse::new(
        request_model.into(),
        Some(response_model.into()),
    )))
}

async fn execute_request(
    request_method: &String,
    url: &String,
    body: Option<&str>,
    headers: &BTreeMap<String, String>,
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

    REQUEST_CLIENT
        .request(request_method, url)
        .headers(header_map)
        .body(body.unwrap_or_default().to_string())
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

#[tracing::instrument(skip_all)]
pub async fn requests_list_handler(
    State(store): State<Store>,
) -> Result<Json<Vec<models::RequestSummary>>, ApiServerError<RequestListError>> {
    let tx = store.start_readonly_transaction().await?;

    let requests = store.request_list(&tx).await?;

    let requests: Vec<_> = requests.into_iter().map(Into::into).collect();

    Ok(Json(requests))
}

#[tracing::instrument(skip_all)]
pub async fn requests_get_handler(
    State(store): State<Store>,
    Path(id): Path<i64>,
) -> Result<Json<RequestWithResponse>, ApiServerError<RequestGetError>> {
    let tx = store.start_readonly_transaction().await?;

    let request = store.request_get(&tx, id).await?;

    let response = store.response_get_by_request_id(&tx, request.id).await?;
    let response: Option<Response> = response.map(|response| response.into());

    Ok(Json(RequestWithResponse::new(request.into(), response)))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RequestGetError {
    #[api_error(status_code = StatusCode::NOT_FOUND)]
    #[error("Request not found")]
    RequestNotFound,
}

impl From<DbError> for ApiServerError<RequestGetError> {
    fn from(value: DbError) -> Self {
        match value {
            DbError::NotFound => ApiServerError::ServiceError(RequestGetError::RequestNotFound),
            _ => ApiServerError::CommonError(CommonError::InternalServerError),
        }
    }
}

#[tracing::instrument(skip_all)]
pub async fn request_delete_handler() -> impl IntoResponse {
    StatusCode::NOT_IMPLEMENTED
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RequestListError {}

impl ApiError for RequestListError {
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

impl From<DbError> for ApiServerError<RequestListError> {
    fn from(_value: DbError) -> Self {
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}
