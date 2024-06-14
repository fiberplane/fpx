use crate::data::store::Store;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use http::StatusCode;

#[tracing::instrument(skip_all)]
pub async fn request_get_handler(
    State(store): State<Store>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let tx = store.start_transaction().await.unwrap(); // TODO

    let request = store.request_get(&tx, id).await.unwrap(); // TODO

    serde_json::to_string_pretty(&request).unwrap()
}

#[tracing::instrument(skip_all)]
pub async fn request_delete_handler() -> impl IntoResponse {
    StatusCode::NOT_IMPLEMENTED
}
