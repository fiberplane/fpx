use fpx::api;
use fpx::config::FpxConfig;
use fpx::data::libsql_store::LibsqlStore;
use fpx::events::memory::InMemoryEvents;
use fpx::service::Service;
use std::sync::{Arc, Mutex};
use tauri::async_runtime::spawn;
use tokio::sync::broadcast::error::RecvError;
use tracing::{error, info, trace, warn};

#[derive(Debug, Default)]
pub struct ApiManager {
    // Sending a message on this channel will shutdown the axum server.
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

impl ApiManager {
    pub fn start_api(&self, fpx_config: FpxConfig) {
        let mut shutdown_tx = self.shutdown_tx.lock().expect("lock is poisoned");
        if let Some(shutdown_tx) = shutdown_tx.take() {
            // shutdown any existing api server
            let _ = shutdown_tx.send(());
        }

        // Start a listener early, so that we can handle the issue where another
        // process is listening already on that specific port.
        let listen_port = fpx_config.listen_port.unwrap_or(6767);
        let listener = std::net::TcpListener::bind(format!("127.0.0.1:{listen_port}")).unwrap();
        listener.set_nonblocking(true).unwrap();

        let (shutdown, on_shutdown) = tokio::sync::oneshot::channel::<()>();
        *shutdown_tx = Some(shutdown);

        spawn(async move {
            let store = LibsqlStore::in_memory().await.unwrap();
            LibsqlStore::migrate(&store).await.unwrap();
            let store = Arc::new(store);

            // Create a event sink that simply logs
            let events = InMemoryEvents::new();
            let events = Arc::new(events);

            // Our current implementation simply logs the events.
            let mut reader = events.subscribe();
            spawn(async move {
                loop {
                    match reader.recv().await {
                        Ok(message) => {
                            // Here we can do something with events, like
                            // emitting them to the frontend:
                            // window.emit("api_message", message).expect("emit failed");
                            info!("Received message: {:?}", message);
                        }
                        Err(RecvError::Lagged(i)) => {
                            warn!(lagged = i, "Event reader lagged behind");
                        }
                        Err(RecvError::Closed) => {
                            trace!("Event reader loop stopped");
                            break;
                        }
                    }
                }
            });

            let service = Service::new(store.clone(), events.clone());

            let app = api::Builder::new()
                .enable_compression()
                .allow_origin_any()
                .build(service.clone(), store.clone());

            let listener = tokio::net::TcpListener::from_std(listener).unwrap();
            let api_server = axum::serve(listener, app).with_graceful_shutdown(async {
                // Once we receive something on the [`on_shutdown`] channel,
                // we'll resolve this future, and thus axum will shutdown.
                // We are wrapping this in another future because of the
                // incompatible return type of the oneshot channel.
                let _ = on_shutdown.await;
                trace!("Received API shutdown signal");
            });

            if let Err(err) = api_server.await {
                error!(?err, "API server returned an error");
            };
        });
    }

    pub fn stop_api(&self) {
        let mut shutdown_tx = self.shutdown_tx.lock().expect("lock is poisoned");
        if let Some(shutdown_tx) = shutdown_tx.take() {
            // shutdown any existing api servers
            let _ = shutdown_tx.send(());
        }
    }
}
