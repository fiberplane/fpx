// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use state::AppState;
use tauri::menu::{MenuBuilder, MenuId, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, WebviewWindowBuilder};
use tauri::{Manager, Wry};
use tauri_plugin_store::StoreCollection;

mod commands;
mod models;
mod state;

const MAIN_WINDOW_ID: &str = "main-window";
const STORE_PATH: &str = "fpx.bin";

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .setup(|app| {
            app.handle()
                .try_state::<StoreCollection<Wry>>()
                .ok_or("Store not found")
                .unwrap();

            let quit_app = MenuItemBuilder::new("Quit")
                .id("quit_app")
                .build(app)
                .unwrap();

            let open_workspace = MenuItemBuilder::new("Open workspace")
                .id("open_workspace")
                .build(app)
                .unwrap();

            let close_workspace = MenuItemBuilder::new("Close workspace")
                .id("close_workspace")
                .build(app)
                .unwrap();

            let app_menu = SubmenuBuilder::new(app, "App")
                .item(&open_workspace)
                .item(&close_workspace)
                .separator()
                .item(&quit_app)
                .build()
                .unwrap();

            let menu = MenuBuilder::new(app).items(&[&app_menu]).build().unwrap();

            app.set_menu(menu).unwrap();

            let window = WebviewWindowBuilder::new(
                app,
                MAIN_WINDOW_ID.to_string(),
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("fpx")
            .build()?;

            let window_ = window.clone();
            window.on_menu_event(move |_app, event| {
                let MenuId(id) = event.id();

                match id.as_str() {
                    "quit_app" => {
                        std::process::exit(0);
                    }
                    "close_workspace" => {
                        window_.emit("request-close-workspace", "").unwrap();
                    }
                    "open_workspace" => {
                        window_.emit("request-open-dialog", "").unwrap();
                    }
                    _ => {}
                }
            });

            let window_ = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let app_state = window_.state::<AppState>();
                    if app_state.get_workspace().is_some() {
                        api.prevent_close();
                        window_.emit("request-close-workspace", "").unwrap();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workspace::close_workspace,
            commands::workspace::get_current_workspace,
            commands::workspace::list_recent_workspaces,
            commands::workspace::open_workspace_by_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
