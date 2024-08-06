use crate::api::models::ServerMessage;
use axum::async_trait;

#[async_trait]
pub trait ServerEvents: Sync + Send {
    async fn broadcast(&self, msg: ServerMessage);
}
