// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use state::AppState;

mod commands;
mod models;
mod state;

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::workspace::close_workspace,
            commands::workspace::get_current_workspace,
            commands::workspace::open_workspace_by_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
