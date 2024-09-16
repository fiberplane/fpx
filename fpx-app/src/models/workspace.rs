use serde::{Deserialize, Serialize};

#[derive(Serialize, Clone)]
pub struct Workspace {
    pub path: String,
    config: Config,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Config {
    port: u16,
}

impl Workspace {
    pub fn new(path: String, config: Config) -> Self {
        Self { path, config }
    }
}
#[derive(Serialize)]
pub enum OpenWorkspaceByPathError {
    ConfigFileMissing,
    InvalidConfiguration,
}
