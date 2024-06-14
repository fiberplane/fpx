use crate::{api::ApiState, inspector::InspectorConfig};
use axum::{extract::State, response::IntoResponse, Json};

#[tracing::instrument(skip_all)]
pub async fn inspector_list_handler(
    State(ApiState {
        inspector_service, ..
    }): State<ApiState>,
) -> impl IntoResponse {
    let inspectors = inspector_service.list().await.unwrap();

    let result = serde_json::to_string(&inspectors).unwrap();

    Json(result)
}

#[tracing::instrument(skip_all)]
pub async fn inspector_create_handler(
    State(ApiState {
        inspector_service, ..
    }): State<ApiState>,
    Json(inspector_config): Json<InspectorConfig>,
) -> impl IntoResponse {
    inspector_service
        .create(inspector_config, true)
        .await
        .unwrap();

    // TODO: This should return the same payload as the GET /inspectors/{id} endpoint

    "Ok"
}
