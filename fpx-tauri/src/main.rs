// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use models::AppState;
use std::env;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_store::StoreBuilder;

mod commands;
mod models;

const STORE_PATH: &str = "store.bin";

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(move |app| {
            StoreBuilder::new(app.handle(), STORE_PATH.parse()?).build();
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_recent_projects,
            commands::open_project,
            commands::start_server,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
