use crate::models::{AppState, OpenProjectError, Project};
use crate::STORE_PATH;
use fpx_lib::data::libsql::LibsqlStore;
use fpx_lib::events::memory::InMemoryEvents;
use fpx_lib::service::Service;
use fpx_lib::{api, events};
use serde_json::Value;
use std::sync::{Arc, Mutex};
use std::{fs::File, io::Read};
use tauri::async_runtime::spawn;
use tauri::{AppHandle, Runtime, State, Window, WindowBuilder, WindowEvent, WindowUrl};
use tauri_plugin_store::{with_store, StoreCollection};
use tokio::sync::broadcast::error::RecvError;

const RECENT_PROJECTS_STORE_KEY: &str = "recent_projects";

#[tauri::command]
pub fn list_recent_projects<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Vec<String> {
    if let Ok(recent_projects) = with_store(app, stores, STORE_PATH, |store| {
        if let Some(Value::Array(arr)) = store.get(RECENT_PROJECTS_STORE_KEY) {
            let vec_of_strings: Vec<String> = arr
                .iter()
                .filter_map(|item| item.as_str().map(|s| s.to_string()))
                .collect();

            return Ok(vec_of_strings);
        }

        Ok(vec![])
    }) {
        return recent_projects;
    }

    vec![]
}

#[tauri::command]
pub fn open_project<R: Runtime>(
    path: &str,
    window: Window,
    state: State<'_, Mutex<AppState>>,
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Result<Project, OpenProjectError> {
    let config_path = format!("{}/fpx.toml", path);

    let mut file = File::open(config_path.clone())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    let project = toml::from_str::<Project>(&contents)?;
    let mut state = state.lock().expect("failed to get lock on state");
    state.project = Some(project.clone());

    let generated_url = format!("http://localhost:{}", &project.listen_port);

    let project_window = WindowBuilder::new(
        &app,
        "studio",
        WindowUrl::External(generated_url.parse().unwrap()),
    )
    .title("fpx")
    .build()
    .expect("failed to build project window");

    window.hide().unwrap();

    project_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            window.show().unwrap();
        }
    });

    with_store(app, stores, STORE_PATH, |store| {
        let recents = match store.get(RECENT_PROJECTS_STORE_KEY) {
            Some(Value::Array(arr)) => {
                let vec_of_strings: Vec<String> = arr
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect();

                vec_of_strings
            }
            _ => vec![],
        };

        store
            .insert(RECENT_PROJECTS_STORE_KEY.into(), recents.into())
            .unwrap();

        store.save()
    })
    .unwrap();

    Ok(project)
}

#[tauri::command]
pub fn start_server(window: Window) -> Result<(), ()> {
    spawn(async {
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
                        window.emit("api_message", message).expect("emit failed");
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

        let api_server = axum::serve(listener, app);

        if let Err(err) = api_server.await {
            eprintln!("Server error: {:?}", err);
        };
    });
    Ok(())
}
