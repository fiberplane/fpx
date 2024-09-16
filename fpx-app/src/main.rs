// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{fs::read_to_string, sync::Mutex};
use tauri::State;

#[derive(Serialize, Deserialize, Clone)]
struct Config {
    port: u16,
}

#[tauri::command]
fn get_current_workspace(state: State<'_, AppState>) -> Option<Workspace> {
    state.get_workspace()
}

#[tauri::command]
fn open_workspace_by_path(path: String, state: State<'_, AppState>) -> Workspace {
    let content = read_to_string(format!("{}/fpx.toml", path)).unwrap();
    let config: Config = toml::from_str(&content).unwrap();

    let workspace = Workspace::new(path, config);
    state.set_workspace(workspace.clone());

    workspace
}

#[tauri::command]
fn close_workspace(state: State<'_, AppState>) {
    state.close_workspace();
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            close_workspace,
            get_current_workspace,
            open_workspace_by_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize, Clone)]
struct Workspace {
    path: String,
    config: Config,
}

impl Workspace {
    fn new(path: String, config: Config) -> Self {
        Self { path, config }
    }
}

#[derive(Serialize, Deserialize, Default)]
enum WorkspaceError {
    #[default]
    Error,
}

#[derive(Default)]
struct AppState {
    workspace: Mutex<Option<Workspace>>,
}

impl AppState {
    pub fn set_workspace(&self, workspace: Workspace) {
        let mut workspace_lock = self.workspace.lock().unwrap();
        *workspace_lock = Some(workspace);
    }

    pub fn close_workspace(&self) {
        let mut workspace_lock = self.workspace.lock().unwrap();
        *workspace_lock = None;
    }

    pub fn is_workspace_open(&self) -> bool {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.is_some()
    }

    pub fn get_workspace(&self) -> Option<Workspace> {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.as_ref().map(|workspace| workspace.clone())
    }

    pub fn get_workspace_path(&self) -> Option<String> {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.as_ref().map(|ws| ws.path.clone())
    }
}
