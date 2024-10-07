// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::{Context, Result};
use api_manager::ApiManager;
use state::AppState;
use std::env;
use std::time::Duration;
use tauri::menu::{MenuBuilder, MenuId, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, WebviewWindowBuilder};
use tauri::{Manager, Wry};
use tauri_plugin_store::{StoreCollection, StoreExt};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

mod api_manager;
mod commands;
mod models;
mod state;

const MAIN_WINDOW_ID: &str = "main-window";
const STORE_PATH: &str = "fpx.bin";

fn main() {
    if let Err(err) = setup_tracing() {
        eprintln!("error while setting up tracing: {:?}", err);
        std::process::exit(1);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .manage(ApiManager::default())
        .setup(|app| {
            // Init store and load it from disk
            let store = app
                .handle()
                .store_builder(STORE_PATH)
                .auto_save(Duration::from_millis(100))
                .build();

            // If there are no saved settings yet, this will return an error so we ignore the return value.
            let _ = store.load();

            app.manage(store);

            app.handle()
                .try_state::<StoreCollection<Wry>>()
                .ok_or("Store not found")
                .unwrap();

            let open_workspace = MenuItemBuilder::new("Open workspace")
                .id("open_workspace")
                .accelerator("CmdOrCtrl+O")
                .build(app)
                .unwrap();

            let close_workspace = MenuItemBuilder::new("Close workspace")
                .id("close_workspace")
                .accelerator("CmdOrCtrl+W")
                .build(app)
                .unwrap();

            let app_menu = SubmenuBuilder::new(app, "App")
                .item(&open_workspace)
                .item(&close_workspace)
                .separator()
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .separator()
                .close_window()
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
                    "close_workspace" => {
                        let app_state = window_.state::<AppState>();
                        if app_state.get_workspace().is_some() {
                            window_.emit("request-close-workspace", "").unwrap();
                        } else {
                            std::process::exit(0);
                        }
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

fn setup_tracing() -> Result<()> {
    let filter_layer = {
        let directives = env::var("RUST_LOG").unwrap_or_else(|_| "warn,fpx=info".to_string());
        EnvFilter::builder().parse(directives)?
    };

    let log_layer = tracing_subscriber::fmt::layer();

    Registry::default()
        .with(filter_layer)
        .with(log_layer)
        .try_init()
        .context("unable to initialize logger")?;

    Ok(())
}
