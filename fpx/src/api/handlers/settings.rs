use crate::api::errors::{ApiServerError, CommonError};
use crate::api::models::settings::Settings;
use crate::data::{BoxedStore, DbError};
use axum::extract::State;
use axum::Json;
use fpx_macros::ApiError;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::error;

#[tracing::instrument(skip_all)]
pub async fn settings_get(
    State(store): State<BoxedStore>,
) -> Result<Json<Settings>, ApiServerError<SettingsGetError>> {
    let tx = store.start_readonly_transaction().await?;

    let settings = store.settings_get(&tx).await?;

    Ok(Json(settings))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum SettingsGetError {}

impl From<DbError> for ApiServerError<SettingsGetError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to get settings from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[tracing::instrument(skip_all)]
pub async fn settings_upsert(
    State(store): State<BoxedStore>,
    Json(mut json): Json<Settings>,
) -> Result<Json<Settings>, ApiServerError<SettingsUpsertError>> {
    if !json.ai_enabled.unwrap_or_default() {
        json.openai_api_key = None;
        json.anthropic_api_key = None;
    }

    let tx = store.start_readwrite_transaction().await?;

    let settings = store.settings_upsert(&tx, json).await?;

    store.commit_transaction(tx).await?;

    // todo: enable/disable proxy based on settings.proxyEnabled

    Ok(Json(settings))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum SettingsUpsertError {}

impl From<DbError> for ApiServerError<SettingsUpsertError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to upsert settings from database");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}
