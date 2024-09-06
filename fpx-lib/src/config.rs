//! Shared library for interacting with the fpx.toml configuration file.
//!
//! - root directory is the directory in which the fpx.toml and the .fpx
//! directory are stored. fpx should not check outside of this directory.

use anyhow::Result;
use serde::Deserialize;
use std::{env, fs::read_to_string, path::PathBuf};
use tracing::{debug, error};

#[derive(Debug, Clone, Deserialize, Hash, PartialEq, Eq)]
pub struct FpxConfig {
    /// The port on which the API server should listen.
    pub listen_port: Option<u32>,
}

impl FpxConfig {
    /// Create a new FpxConfig instance.
    pub fn new() -> Self {
        FpxConfig { listen_port: None }
    }

    /// Load the configuration from the fpx.toml file it also returns the root
    /// directory that was used.
    ///
    /// This uses [`Self::find_root_directory`] to determine the root directory
    /// unless [`override_root`] is set to [`Some`]. If no fpx.toml was found,
    /// this it will return [`None`].
    pub fn load(override_root: Option<PathBuf>) -> Result<Option<(Self, PathBuf)>> {
        let Some(root_dir) = override_root.or_else(Self::find_root_directory) else {
            debug!("Root directory could not be found");
            return Ok(None);
        };

        let config_file_path = root_dir.join("fpx.toml");
        if !config_file_path.exists() {
            // Note it is possible that the file gets deleted right after this
            // check and before reading it. This can be improved in another PR.
            debug!("fpx.toml file not found in root directory");
            return Ok(None);
        }

        let config_file = read_to_string(&config_file_path)?;
        let config: FpxConfig = toml::from_str(&config_file).unwrap();

        Ok(Some((config, config_file_path)))
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
}
