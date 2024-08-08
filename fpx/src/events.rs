use async_trait::async_trait;
use fpx_lib::api::models::ServerMessage;
use fpx_lib::events::ServerEvents;
use tokio::sync::broadcast;
use tracing::trace;

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
