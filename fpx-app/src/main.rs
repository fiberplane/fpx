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
use tokio::signal::unix::SignalKind;
use tracing::debug;
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

    let api_manager = ApiManager::default();

    // Create a signal handler which will cleanup any resources in use
    // (currently only the api manager) when fpx-app receives the SIGTERM signal.
    let api_manager_ = api_manager.clone();
    tauri::async_runtime::spawn(async move {
        // Block until we receive a SIGTERM signal
        tokio::signal::unix::signal(SignalKind::terminate())
            .expect("Unable to set signal handler")
            .recv()
            .await;

        debug!("received SIGTERM signal, stopping API server");

        api_manager_.stop_api();

        // Do we need to exit the process?
        std::process::exit(0);
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .manage(api_manager)
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workspace::close_workspace,
            commands::workspace::get_current_workspace,
            commands::workspace::list_recent_workspaces,
            commands::workspace::open_workspace_by_path,
        ])
        .build(tauri::generate_context!())
        .expect("failed to build application")
        .run(|app_handle, event| {
            // Make sure we cleanup after the app is going to exit
            if let tauri::RunEvent::ExitRequested { .. } = event {
                let api_manager = app_handle.state::<ApiManager>();
                api_manager.stop_api();
            };
        });
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
