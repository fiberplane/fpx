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
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .setup(|app| {
            app.handle()
                .try_state::<StoreCollection<Wry>>()
                .ok_or("Store not found")
                .unwrap();

            let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            let open = MenuItemBuilder::new("Open workspace")
                .id("open")
                .build(app)
                .unwrap();

            let app_menu = SubmenuBuilder::new(app, "App")
                .item(&open)
                .separator()
                .item(&quit)
                .build()
                .unwrap();

            let menu = MenuBuilder::new(app).items(&[&app_menu]).build().unwrap();

            app.set_menu(menu).unwrap();

            let window = WebviewWindowBuilder::new(
                app,
                MAIN_WINDOW_ID,
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("fpx")
            .build()?;

            let window_ = window.clone();
            window.on_menu_event(move |_app, event| {
                let MenuId(id) = event.id();

                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "open" => {
                        window_.emit("request-open-dialog", "").unwrap();
                    }
                    _ => {}
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
