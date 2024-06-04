use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::debug;

#[derive(Clone)]
pub struct Events<M> {
    sender: broadcast::Sender<M>,
}

pub type EventsState<M> = Arc<Events<M>>;

impl<M: Clone> Events<M> {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(10);
        Self { sender }
    }

    pub async fn broadcast(&self, msg: M) {
        debug!("Broadcasting message:");
        let _ = self.sender.send(msg);
    }

    pub async fn subscribe(&self) -> broadcast::Receiver<M> {
        self.sender.subscribe()
    }
}
