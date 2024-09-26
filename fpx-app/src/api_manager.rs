use fpx::api;
use fpx::config::FpxConfig;
use fpx::data::libsql_store::LibsqlStore;
use fpx::events::memory::InMemoryEvents;
use fpx::service::Service;
use std::sync::{Arc, Mutex};
use tauri::async_runtime::spawn;
use tokio::sync::broadcast::error::RecvError;

#[derive(Debug, Default)]
pub struct ApiManager {
    // join_handle: Option<JoinHandle<()>>,

    // Sending a message on this channel will shutdown the axum server.
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

impl ApiManager {
    pub fn start_api(&self, _fpx_config: FpxConfig) {
        let mut shutdown_tx = self.shutdown_tx.lock().expect("lock is poisoned");
        if let Some(shutdown_tx) = shutdown_tx.take() {
            // shutdown any existing api server
            let _ = shutdown_tx.send(());
        }

        let (shutdown, on_shutdown) = tokio::sync::oneshot::channel::<()>();

        let _join_handle = spawn(async {
            let store: LibsqlStore = LibsqlStore::in_memory().await.unwrap();
            LibsqlStore::migrate(&store).await.unwrap();
            let store = Arc::new(store);

            // Create a shared events struct, which allows events to be send to
            // WebSocket connections.
            let events = InMemoryEvents::new();
            let events = Arc::new(events);

            let mut reader = events.subscribe();
            spawn(async move {
                loop {
                    match reader.recv().await {
                        Ok(message) => {
                            // Here we can do something with events, like emiting them to the frontend:
                            // window.emit("api_message", message).expect("emit failed");
                            eprintln!("Received message: {:?}", message);
                        }
                        Err(RecvError::Lagged(i)) => eprintln!("Lagged: {}", i),
                        Err(RecvError::Closed) => break,
                    }
                }
            });

            let service = Service::new(store.clone(), events.clone());

            let app = api::Builder::new()
                .enable_compression()
                .build(service.clone(), store.clone());

            let listener = tokio::net::TcpListener::bind("127.0.0.1:6767")
                .await
                .unwrap();

            // info!(
            //     api_listen_address = ?listener.local_addr().context("Failed to get local address")?,
            //     grpc_listen_address = ?args.grpc_listen_address,
            //     "Starting server",
            // );

            let api_server = axum::serve(listener, app).with_graceful_shutdown(async {
                let _ = on_shutdown.await;
            });

            if let Err(err) = api_server.await {
                eprintln!("Server error: {:?}", err);
            };
        });

        *shutdown_tx = Some(shutdown);
    }

    pub fn stop_api(&self) {
        let mut shutdown_tx = self.shutdown_tx.lock().expect("lock is poisoned");
        if let Some(shutdown_tx) = shutdown_tx.take() {
            // shutdown any existing api servers
            let _ = shutdown_tx.send(());
        }
    }
}
