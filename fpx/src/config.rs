//! Shared library for interacting with the fpx.toml configuration file.
//!
//! - root directory is the directory in which the fpx.toml and the .fpx
//!   directory are stored. fpx should not check outside of this directory.

use anyhow::Result;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::fs::read_to_string;
use std::path::PathBuf;
use std::{env, ops::Range};
use thiserror::Error;
use tracing::error;

#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq, Default, JsonSchema)]
pub struct FpxConfig {
    /// The port on which the API server should listen.
    pub listen_port: Option<u32>,
}

impl FpxConfig {
    /// Create a new FpxConfig instance.
    pub fn new() -> Self {
        Default::default()
    }

    /// Load the configuration from the fpx.toml file it also returns the root
    /// directory that was used.
    ///
    /// This uses [`Self::find_root_directory`] to determine the root directory
    /// unless [`override_root`] is set to [`Some`].
    pub fn load(override_root: Option<PathBuf>) -> Result<(Self, PathBuf), FpxConfigError> {
        let Some(root_dir) = override_root.or_else(find_root_directory) else {
            return Err(FpxConfigError::RootDirectoryNotFound);
        };

        let config_file_path = root_dir.join("fpx.toml");

        // Optimistically try to read the file, if it fails, return an error.
        let config_file = read_to_string(&config_file_path)
            .map_err(|_| FpxConfigError::FileNotFound(config_file_path.clone()))?;

        let config: FpxConfig =
            toml::from_str(&config_file).map_err(|err| FpxConfigError::InvalidFpxConfig {
                message: err.message().to_string(),
                span: err.span(),
            })?;

        Ok((config, config_file_path))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq, JsonSchema, Error)]
pub enum FpxConfigError {
    #[error("failed to find find root fpx directory")]
    RootDirectoryNotFound,

    #[error("fpx.toml file not found at {0}")]
    FileNotFound(PathBuf),

    #[error("invalid fpx.toml configuration: {message}")]
    InvalidFpxConfig {
        message: String,
        span: Option<Range<usize>>,
    },
}

/// Search for the root directory of the project. The root directory is
/// the one containing a fpx.toml file or a .fpx directory. Returns
/// [`None`] if nothing was found.
///
/// (TODO: should we consider .git to be part of the repo root?).
pub fn find_root_directory() -> Option<PathBuf> {
    let Ok(cwd) = env::current_dir() else {
        error!("Failed to get current directory");
        return None;
    };

    let mut dir = Some(cwd);
    while let Some(inner_dir) = dir {
        let fpx_config = inner_dir.join("fpx.toml");

        // If the fpx.toml file exists, return that immediately.
        if fpx_config.exists() {
            return Some(inner_dir);
        }

        let fpx_dir = inner_dir.join(".fpx");
        // If the .fpx directory exists, return that immediately.
        if fpx_dir.is_dir() {
            return Some(inner_dir);
        }

        dir = inner_dir.parent().map(Into::into);
    }

    None
}
