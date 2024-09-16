use crate::api::models::ServerMessage;
use axum::async_trait;
use std::sync::Arc;

pub mod memory;

pub type BoxedEvents = Arc<dyn ServerEvents>;

#[async_trait]
pub trait ServerEvents: Sync + Send {
    async fn broadcast(&self, msg: ServerMessage);
}
