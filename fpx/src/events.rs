use crate::api::types::ServerMessage;
use tokio::sync::broadcast;
use tracing::trace;

pub type ServerEvents = Events<ServerMessage>;

pub struct Events<M> {
    sender: broadcast::Sender<M>,
}

impl<M: Clone> Events<M> {
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
