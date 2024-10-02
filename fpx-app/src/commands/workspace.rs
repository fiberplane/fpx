use crate::api_manager::ApiManager;
use crate::models::workspace::{OpenWorkspaceError, Workspace};
use crate::state::AppState;
use crate::STORE_PATH;
use fpx::config::{FpxConfig, FpxConfigError};
use std::path::PathBuf;
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_store::{with_store, StoreCollection};

const RECENT_WORKSPACES_STORE_KEY: &str = "recent_workspaces";

#[tauri::command]
pub fn list_recent_workspaces<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Vec<String> {
    with_store(app, stores, STORE_PATH, |store| {
        let recent_projects = store
            .get(RECENT_WORKSPACES_STORE_KEY)
            .and_then(|val| val.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        Ok(recent_projects)
    })
    .unwrap_or_default()
}

#[tauri::command]
pub fn get_current_workspace(state: State<'_, AppState>) -> Option<Workspace> {
    state.get_workspace()
}

#[tauri::command]
pub fn open_workspace_by_path<R: Runtime>(
    path: String,
    app_state: State<'_, AppState>,
    api_manager: State<'_, ApiManager>,
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Result<Workspace, OpenWorkspaceError> {
    api_manager.stop_api();

    let path_buf = PathBuf::from(path.clone());
    let config = match FpxConfig::load(Some(path_buf)) {
        Ok((config, _config_path)) => config,
        Err(err) => {
            return Err(match err {
                FpxConfigError::FileNotFound(path_buf) => OpenWorkspaceError::ConfigFileMissing {
                    path: path_buf.to_string_lossy().to_string(),
                },
                FpxConfigError::InvalidFpxConfig { message, .. } => {
                    OpenWorkspaceError::InvalidConfiguration { message }
                }
                FpxConfigError::RootDirectoryNotFound => {
                    unreachable!("FpxConfig::load takes a path, so this cannot occur")
                }
            })
        }
    };

    api_manager.start_api(config.clone());

    let workspace = Workspace::new(path.clone(), config);
    app_state.set_workspace(workspace.clone());

    with_store(app, stores, STORE_PATH, |store| {
        let mut recents: Vec<String> = store
            .get(RECENT_WORKSPACES_STORE_KEY)
            .and_then(|value| value.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|item| item.as_str().filter(|s| s != &path).map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        recents.insert(0, path);

        store
            .insert(RECENT_WORKSPACES_STORE_KEY.into(), recents.into())
            .unwrap();

        store.save()
    })
    .unwrap();

    Ok(workspace)
}

#[tauri::command]
pub fn close_workspace(state: State<'_, AppState>, api_manager: State<'_, ApiManager>) {
    api_manager.stop_api();
    state.close_workspace();
}
