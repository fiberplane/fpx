// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{env, fs::File, io::Read, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Manager, Runtime, State, Window, WindowBuilder, WindowEvent, WindowUrl};
use tauri_plugin_store::{with_store, StoreBuilder, StoreCollection};

const STORE_PATH: &str = "store.bin";

#[derive(Parser, Debug)]
pub struct Args {
    pub project_path: Option<PathBuf>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Project {
    pub listen_port: u16,
}

#[derive(Default)]
struct AppState {
    pub project: Option<Project>,
}

#[derive(Serialize)]
enum OpenProjectError {
    Err,
}

#[tauri::command]
fn list_recent_projects<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Vec<String> {
    if let Ok(recent_projects) = with_store(app, stores, STORE_PATH, |store| {
        if let Some(value) = store.get("recent_projects") {
            if let Value::Array(arr) = value {
                // Try to collect the elements as Vec<String>
                let vec_of_strings: Vec<String> = arr
                    .iter()
                    .filter_map(|item| {
                        // Try to convert each element into a string
                        item.as_str().map(|s| s.to_string())
                    })
                    .collect();

                return Ok(vec_of_strings);
            }
        }

        Ok(vec![])
    }) {
        return recent_projects;
    }

    vec![]
}

#[tauri::command]
fn open_project<R: Runtime>(
    path: &str,
    window: Window,
    state: State<'_, Mutex<AppState>>,
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Result<Project, OpenProjectError> {
    with_store(app.clone(), stores, STORE_PATH, |store| {
        let recents = match store.get("recent_projects") {
            Some(value) => {
                match value {
                    Value::Array(arr) => {
                        // Try to collect the elements as Vec<String>
                        let vec_of_strings: Vec<String> = arr
                            .iter()
                            .filter_map(|item| {
                                // Try to convert each element into a string
                                item.as_str().map(|s| s.to_string())
                            })
                            .collect();

                        vec_of_strings
                    }
                    _ => vec![],
                }
            }
            None => vec![],
        };

        println!("{:?}", store.get("recent_projects"));
        store
            .insert("recent_projects".into(), recents.into())
            .unwrap();

        store.save()
    })
    .unwrap();

    let path = format!("{}/fpx.toml", path);

    let mut file = File::open(path.clone()).expect("file not found");
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("can't read file");

    let project = toml::from_str::<Project>(&contents).expect("invalid config fpx.toml");
    let mut state = state.lock().expect("failed to get lock on state");
    state.project = Some(project.clone());

    let generated_url = format!("http://localhost:{}", &project.listen_port);

    let project_window = WindowBuilder::new(
        &app,
        "new_window",
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

    Ok(project)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(move |app| {
            StoreBuilder::new(app.handle(), STORE_PATH.parse()?).build();
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_project, list_recent_projects])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
