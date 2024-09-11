use serde::{Deserialize, Serialize};
use std::io;

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
    ConfigError,
    FileError,
}

impl From<toml::de::Error> for OpenProjectError {
    fn from(_error: toml::de::Error) -> Self {
        Self::ConfigError
    }
}

impl From<io::Error> for OpenProjectError {
    fn from(_error: io::Error) -> Self {
        Self::FileError
    }
}
