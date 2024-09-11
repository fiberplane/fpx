use serde::{Deserialize, Serialize};

#[derive(Default)]
pub struct AppState {
    pub project: Option<Project>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Project {
    pub listen_port: u16,
}

#[derive(Serialize)]
pub enum OpenProjectError {
    InvalidConfig,
    FileDoesNotExist,
    FailedToOpenFile,
}
