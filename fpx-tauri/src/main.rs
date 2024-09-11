// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use serde::{Deserialize, Serialize};
use std::{env, fs::File, io::Read, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Manager, State, Window, WindowBuilder, WindowEvent, WindowUrl};

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
fn open_project(
    window: Window,
    path: &str,
    state: State<'_, Mutex<AppState>>,
    app: AppHandle,
) -> Result<Project, OpenProjectError> {
    let path = format!("{}/fpx.toml", path);
    let mut file = File::open(path).expect("file not found");
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
        .setup(move |app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![open_project])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
