use async_trait::async_trait;
use fpx::api::models::ServerMessage;
use fpx::events::ServerEvents;
use tokio::sync::broadcast;
use tracing::trace;

#[derive(Clone)]
pub struct InMemoryEvents {
    sender: broadcast::Sender<ServerMessage>,
}

impl InMemoryEvents {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(100);
        Self { sender }
    }

    pub async fn subscribe(&self) -> broadcast::Receiver<ServerMessage> {
        self.sender.subscribe()
    }
}

impl Default for InMemoryEvents {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ServerEvents for InMemoryEvents {
    async fn broadcast(&self, message: ServerMessage) {
        if let Err(err) = self.sender.send(message) {
            // Note: this only happens when the channel is closed. Which also
            // happens when there a no subscribers. So there is not need to log
            // this as an warn or error.
            trace!(%err, "failed to broadcast message");
        };
    }
}
