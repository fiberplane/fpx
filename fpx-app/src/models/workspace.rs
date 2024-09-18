use fpx::config::FpxConfig;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(JsonSchema, Deserialize, Serialize, Clone)]
pub struct Workspace {
    path: String,
    config: FpxConfig,
}

impl Workspace {
    pub fn new(path: String, config: FpxConfig) -> Self {
        Self { path, config }
    }
}

#[derive(JsonSchema, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum OpenWorkspaceByPathError {
    ConfigFileMissing { path: String },
    InvalidConfiguration { message: String },
}
