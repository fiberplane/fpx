//! The events module abstracts away the details of subscribing and broadcasting
//! messages all subscribers. Currently this does not add anything extra to the
//! [`tokio::sync::broadcast`] module and the [`Events`] struct even leaks the
//! the [`broadcast::Receiver`] struct. So we might want to reconsider this
//! module.

use crate::models::ServerMessage;
use tokio::sync::broadcast;
use tracing::trace;

/// A [`Events`] implementation for the [`ServerMessage`] type.
pub type ServerEvents = Events<ServerMessage>;

#[derive(Clone)]
pub struct Events<M> {
    sender: broadcast::Sender<M>,
}

impl<M> Events<M>
where
    M: Clone,
{
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(100);
        Self { sender }
    }

    pub fn broadcast(&self, msg: M) {
        trace!("Broadcasting message");
        let _ = self.sender.send(msg);
    }

    pub async fn subscribe(&self) -> broadcast::Receiver<M> {
        self.sender.subscribe()
    }
}

impl<M> Default for Events<M>
where
    M: Clone,
{
    fn default() -> Self {
        Self::new()
    }
}
