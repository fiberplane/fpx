//! This module contains code related to the inspectors. An inspector allows us
//! to create a transparent proxy which will capture all requests, proxy them to
//! remote address and then return the response to to the original requester. It
//! will store the original request and the response to the client.
//!
//! Note that this is a work in progress implementation. Currently some features
//! do not work as expected or are implemented at all.

use crate::api::types::RequestAdded;
use crate::data::store::Store;
use crate::events::ServerEvents;
use anyhow::{Context, Result};
use axum::extract::{Path, Request, State};
use axum::response::IntoResponse;
use axum::routing::any;
use futures_util::Future;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::broadcast;
use tracing::{error, info, trace};

/// This service manages multiple inspectors.
pub struct InspectorService {
    inspector_config_path: PathBuf,

    inspectors: Vec<InspectorInstance>,

    /// Temporary way to shutdown all the inspectors.
    shutdown: broadcast::Sender<()>,

    store: Store,
    events: Arc<ServerEvents>,
}

impl InspectorService {
    /// Create and start an inspector service.
    pub async fn start(
        config_path: PathBuf,
        store: Store,
        events: Arc<ServerEvents>,
    ) -> Result<Self> {
        // Get all the .toml files
        let configs: Vec<_> = std::fs::read_dir(&config_path)
            .with_context(|| format!("Unable to read the contents: {config_path:?}"))?
            // Ignore any entries that result in a error
            .filter_map(Result::ok)
            // Filter out any entries that are not files and do not have a .toml extension
            .filter_map(|entry| {
                if entry.file_type().unwrap().is_file() {
                    let path = entry.path();
                    let extension = path.extension().unwrap_or_default();
                    if extension == "toml" {
                        return Some(path);
                    } else {
                        return None;
                    }
                }
                None
            })
            // Read the content and parse as InspectorConfig
            .map(|path| {
                // Read the contents of the file
                let contents = std::fs::read_to_string(&path).with_context(|| {
                    format!("Unable to read the contents of the file: {path:?}")
                })?;

                // Parse the contents of the file
                let result: InspectorConfig = toml::from_str(&contents).with_context(|| {
                    format!("Unable to parse the contents of the file: {path:?}")
                })?;

                anyhow::Ok(result)
            })
            .collect();

        let (shutdown, _) = broadcast::channel(100);
        let result = InspectorService {
            inspectors: Vec::new(),
            shutdown,
            store,
            events,
            inspector_config_path: config_path,
        };

        for config in configs {
            match config {
                Ok(config) => {
                    trace!("Starting inspector: {:#?}", config.name);
                    result.create(config, false).await?;
                }
                Err(e) => {
                    error!("Error: {:#?}", e);
                }
            }
        }

        Ok(result)
    }

    pub async fn list(&self) -> Result<Vec<&InspectorConfig>> {
        let result = self
            .inspectors
            .iter()
            .map(|inspector| inspector.config())
            .collect();

        Ok(result)
    }

    pub async fn create(&self, inspector_config: InspectorConfig, persist: bool) -> Result<()> {
        info!("Starting inspector: {:#?}", inspector_config.name);

        if persist {
            let serialized_toml = toml::to_string_pretty(&inspector_config)
                .with_context(|| "Unable to serialize the inspector config")?;
            let path = self
                .inspector_config_path
                .join(format!("{}.toml", inspector_config.name));
            let mut file = File::create(path).await?;
            file.write_all(serialized_toml.as_bytes()).await?;
        }

        let mut shutdown = self.shutdown.subscribe();
        let inspector_instance =
            InspectorInstance::new(inspector_config, self.store.clone(), self.events.clone());

        tokio::spawn(async move {
            trace!("Starting inspector: {:#?}", inspector_instance.config.name);
            let result = inspector_instance
                .start(async move {
                    let _ = shutdown.recv().await;
                })
                .await
                .with_context(|| {
                    format!(
                        "failed to run the proxy instance: {}",
                        inspector_instance.config.name
                    )
                });

            if let Err(err) = result {
                error!("Inspector failed: {err:?}");
            } else {
                trace!("Inspector stopped: {:#?}", inspector_instance.config.name)
            }
        });

        Ok(())
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InspectorConfig {
    pub name: String,
    pub port: u16,

    pub upstream_protocol: String,
    pub upstream_host: String,
    pub upstream_port: u16,
}

/// An internal representation of an inspector. Used to manage the lifecycle of
/// a single inspector.
pub struct InspectorInstance {
    config: InspectorConfig,

    store: Store,
    events: Arc<ServerEvents>,
}

impl InspectorInstance {
    pub fn new(config: InspectorConfig, store: Store, events: Arc<ServerEvents>) -> Self {
        Self {
            config,
            store,
            events,
        }
    }

    /// Start the proxy instance. This will block until it gets killed.
    pub async fn start<F>(&self, shutdown: F) -> Result<()>
    where
        F: Future<Output = ()> + Send + 'static,
    {
        // TODO: Only listen on localhost for now
        let listener = tokio::net::TcpListener::bind(("127.0.0.1", self.config.port))
            .await
            .with_context(|| format!("Failed to bind to port: {}", self.config.port))?;

        let inspector_state = InspectorState {
            store: self.store.clone(),
            events: self.events.clone(),
        };

        let app = axum::Router::new()
            .route("/", any(handle_request))
            .route("/*path", any(handle_request))
            .with_state(inspector_state);

        // start the inspector server
        axum::serve(listener, app)
            .with_graceful_shutdown(shutdown)
            .await
            .context("Failed to start the HTTP server")?;

        Ok(())
    }

    pub fn config(&self) -> &InspectorConfig {
        &self.config
    }
}

#[derive(Clone)]
struct InspectorState {
    store: Store,
    events: Arc<ServerEvents>,
}

async fn handle_request(
    State(InspectorState { store, events, .. }): State<InspectorState>,
    path: Option<Path<String>>,
    req: Request,
) -> impl IntoResponse {
    let tx = store.start_transaction().await.unwrap();

    let headers: BTreeMap<String, String> = req
        .headers()
        .iter()
        .map(|(key, value)| {
            (
                key.as_str().to_string(),
                value.to_str().unwrap().to_string(),
            )
        })
        .collect();

    let request_id = Store::request_create(
        &tx,
        req.method().as_ref(),
        &req.uri().to_string(),
        "body",
        headers,
    )
    .await
    .unwrap();

    info!("Store request: {}", request_id);

    match path {
        Some(path) => info!("Received request: /{}", *path),
        None => info!("Received request: /"),
    }

    tx.commit().await.unwrap();

    events.broadcast(RequestAdded::new(request_id, None).into());

    "Ok"
}
