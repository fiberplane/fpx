use fpx::config::FpxConfig;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(JsonSchema, Deserialize, Serialize, Clone)]
pub struct Workspace {
    path: String,
    api_port: u32,
}

impl Workspace {
    pub fn new(path: String, config: FpxConfig) -> Self {
        Self {
            path,
            api_port: config.listen_port(),
        }
    }
}

#[derive(JsonSchema, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum OpenWorkspaceError {
    ConfigFileMissing { path: String },
    InvalidConfiguration { message: String },
}
