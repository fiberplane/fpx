// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use state::AppState;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, WindowBuilder};

mod commands;
mod models;
mod state;

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let open = CustomMenuItem::new("open".to_string(), "Open");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(open));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            let window = WindowBuilder::new(
                app,
                "main-window".to_string(),
                tauri::WindowUrl::App("index.html".into()),
            )
            .menu(menu)
            .build()?;

            let window_ = window.clone();
            window.on_menu_event(move |event| match event.menu_item_id() {
                "quit" => {
                    std::process::exit(0);
                }
                "open" => {
                    window_.emit("request-open-dialog", "").unwrap();
                }
                _ => {}
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workspace::close_workspace,
            commands::workspace::get_current_workspace,
            commands::workspace::open_workspace_by_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
