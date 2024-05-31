use serde::{Deserialize, Serialize};

pub const FPX_WEBSOCKET_ID_HEADER: &str = "fpx-websocket-id";

/// Messages that are send from the server to the client.
#[derive(Clone, Serialize, Deserialize)]
pub enum ServerMessage {
    Ack,
    Error,
    Otel,

    Issue(Box<IssueMessage>),
}

/// Messages that are send from the client to the server.
#[derive(Clone, Serialize, Deserialize)]
pub enum ClientMessage {
    Debug,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct IssueMessage {
    pub repo_owner: String,
    pub repo_name: String,
    pub issue_number: u64,

    pub title: String,
    pub description: String,
    pub author: String,
    // Etc....
}

impl IssueMessage {
    pub fn new(
        repo_owner: impl Into<String>,
        repo_name: impl Into<String>,
        issue_number: u64,
        title: impl Into<String>,
        description: impl Into<String>,
        author: impl Into<String>,
    ) -> Self {
        IssueMessage {
            repo_owner: repo_owner.into(),
            repo_name: repo_name.into(),
            issue_number,
            title: title.into(),
            description: description.into(),
            author: author.into(),
        }
    }
}

impl From<IssueMessage> for ServerMessage {
    fn from(value: IssueMessage) -> Self {
        ServerMessage::Issue(Box::new(value))
    }
}
