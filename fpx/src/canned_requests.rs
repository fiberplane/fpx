use crate::api::errors::ApiServerError;
use crate::api::handlers::canned_requests::CannedRequestListError;
use anyhow::{anyhow, bail, Context, Result};
use http::Method;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use std::collections::BTreeMap;
use std::fmt::{Display, Formatter};
use std::path::PathBuf;
use tokio::fs;
use tokio::sync::RwLock;

static EPHEMERAL_REQUESTS: Lazy<RwLock<BTreeMap<String, CannedRequest>>> =
    Lazy::new(|| RwLock::new(BTreeMap::new()));

#[serde_as]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CannedRequest {
    #[serde(default, skip)]
    pub name: String,

    #[serde_as(as = "DisplayFromStr")]
    pub method: Method,
    pub url: String,

    pub headers: BTreeMap<String, String>,
    pub cookies: BTreeMap<String, String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub body: Option<Vec<u8>>,
}

#[derive(Debug)]
pub enum SaveLocation {
    /// will be removed once `fpx dev` is closed
    Ephemeral,
    /// will be stored in the data directory of `fpx`
    /// the first argument is passed by the CLI
    Personal(PathBuf),
    /// will be stored in a folder specified by the argument
    Shared(PathBuf),
}

impl SaveLocation {
    pub fn try_parse(input: &str, path: PathBuf) -> Result<Self> {
        Ok(match input.to_lowercase().as_str() {
            "ephemeral" => Self::Ephemeral,
            "personal" => Self::Personal(path),
            "shared" => Self::Shared(path),
            _ => bail!("unknown variant"),
        })
    }
}

impl Display for SaveLocation {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            SaveLocation::Ephemeral => write!(f, "ephemeral"),
            SaveLocation::Personal(_) => write!(f, "personal"),
            SaveLocation::Shared(_) => write!(f, "shared"),
        }
    }
}

impl CannedRequest {
    pub async fn load_all(
        location: SaveLocation,
    ) -> Result<Vec<Self>, ApiServerError<CannedRequestListError>> {
        match &location {
            SaveLocation::Ephemeral => Ok(EPHEMERAL_REQUESTS
                .read()
                .await
                .iter()
                .map(|(name, request)| {
                    let mut request = request.clone();
                    request.name = name.to_string();
                    request
                })
                .collect()),
            SaveLocation::Personal(path) | SaveLocation::Shared(path) => {
                let mut dir = fs::read_dir(path).await.map_err(|err| anyhow!(err))?;
                let mut results = vec![];

                while let Some(entry) = dir.next_entry().await.map_err(|err| anyhow!(err))? {
                    let file_name = entry
                        .file_name()
                        .to_str()
                        .ok_or_else(|| anyhow!("conversion into os string failed"))?
                        .to_string();

                    let Some((file_name, extension)) = file_name.rsplit_once('.') else {
                        continue;
                    };

                    if extension != "toml" {
                        continue;
                    }

                    results.push(Self::load(file_name, &location).await?);
                }

                Ok(results)
            }
        }
    }

    pub async fn load(
        name: &str,
        location: &SaveLocation,
    ) -> Result<Self, ApiServerError<CannedRequestListError>> {
        match location {
            SaveLocation::Ephemeral => {
                let mut request = EPHEMERAL_REQUESTS
                    .read()
                    .await
                    .get(name)
                    .ok_or(CannedRequestListError::NotFound)?
                    .clone();

                request.name = name.to_string();
                Ok(request)
            }
            SaveLocation::Personal(path) | SaveLocation::Shared(path) => {
                let path = path.join(format!("{name}.toml"));

                let data = fs::read_to_string(path).await.map_err(|err| anyhow!(err))?;

                let mut data: Self = toml::from_str(&data).map_err(|err| anyhow!(err))?;
                data.name = name.to_string();

                Ok(data)
            }
        }
    }

    pub async fn save(self, location: SaveLocation) -> Result<()> {
        match location {
            SaveLocation::Ephemeral => {
                EPHEMERAL_REQUESTS
                    .write()
                    .await
                    .insert(self.name.to_string(), self);

                Ok(())
            }
            SaveLocation::Personal(path) | SaveLocation::Shared(path) => {
                fs::create_dir_all(&path)
                    .await
                    .context("failed to create directory")?;

                let data = toml::to_string_pretty(&self)
                    .context("failed to serialize into toml format")?;

                let file = path.join(format!("{}.toml", self.name));

                fs::write(file, data).await.context("failed to write file")
            }
        }
    }
}
