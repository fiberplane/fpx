use crate::api::errors::{ApiServerError, CommonError};
use crate::data::models::{AllRoutes, ProbedRoutes, Route};
use crate::data::{BoxedStore, DbError};
use axum::extract::{Path, State};
use axum::Json;
use fpx_macros::ApiError;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::error;
use tracing::instrument;

#[instrument(skip(store))]
pub async fn route_get(
    State(store): State<BoxedStore>,
) -> Result<Json<AllRoutes>, ApiServerError<RoutesGetError>> {
    let tx = store.start_readonly_transaction().await?;

    let routes = store.routes_get(&tx).await?;

    store.commit_transaction(tx).await?;

    Ok(Json(AllRoutes {
        base_url: "http://localhost:8787".to_string(), // todo: get the right base url
        routes,
    }))
}

#[derive(Debug, Serialize, Deserialize, Err or, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RoutesGetError {}

impl From<DbError> for ApiServerError<RoutesGetError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to get all routes from db");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[instrument(skip_all)]
pub async fn route_probe(
    State(store): State<BoxedStore>,
    Json(payload): Json<ProbedRoutes>,
) -> Result<&'static str, ApiServerError<RouteProbeError>> {
    if payload.routes.is_empty() {
        return Ok("OK");
    }

    let tx = store.start_readwrite_transaction().await?;

    store.probed_route_upsert(&tx, payload).await?;

    store.commit_transaction(tx).await?;

    // TODO: send out ws message informing studio that there are new routes

    Ok("OK")
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RouteProbeError {}

impl From<DbError> for ApiServerError<RouteProbeError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to insert probed routes into db");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[instrument(skip(store))]
pub async fn route_create(
    State(store): State<BoxedStore>,
    Json(route): Json<Route>, // TODO: the ts api also accepts a array of routes as input, have to figure out a Either-style way to do that
) -> Result<Json<Route>, ApiServerError<RouteCreateError>> {
    let tx = store.start_readwrite_transaction().await?;

    let route = store.route_insert(&tx, route).await?;

    store.commit_transaction(tx).await?;

    Ok(Json(route))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RouteCreateError {}

impl From<DbError> for ApiServerError<RouteCreateError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to create rows inside db");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}

#[instrument(skip(store))]
pub async fn route_delete(
    State(store): State<BoxedStore>,
    Path((method, path)): Path<(String, String)>,
) -> Result<Json<Option<Route>>, ApiServerError<RouteDeleteError>> {
    let tx = store.start_readwrite_transaction().await?;

    let route = store.route_delete(&tx, &method, &path).await?;

    store.commit_transaction(tx).await?;

    Ok(Json(route))
}

#[derive(Debug, Serialize, Deserialize, Error, ApiError)]
#[serde(tag = "error", content = "details", rename_all = "camelCase")]
#[non_exhaustive]
pub enum RouteDeleteError {}

impl From<DbError> for ApiServerError<RouteDeleteError> {
    fn from(err: DbError) -> Self {
        error!(?err, "Failed to delete route(s) from db");
        ApiServerError::CommonError(CommonError::InternalServerError)
    }
}
