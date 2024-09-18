use crate::models::workspace::{Config, OpenWorkspaceByPathError, Workspace};
use crate::state::AppState;
use crate::STORE_PATH;
use std::fs::read_to_string;
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_store::{with_store, StoreCollection};

const RECENT_WORKSPACES_STORE_KEY: &str = "recent_workspaces";

#[tauri::command]
pub fn list_recent_workspaces<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Vec<String> {
    with_store(app, stores, STORE_PATH, |store| {
        let result: Vec<String> = store
            .get(RECENT_WORKSPACES_STORE_KEY)
            .map(|val| {
                val.as_array().map(|arr| {
                    arr.iter()
                        .filter_map(|item| item.as_str().map(|s| s.to_string()))
                        .collect()
                })
            })
            .flatten()
            .unwrap_or_default();

        Ok(result)
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
    state: State<'_, AppState>,
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Result<Workspace, OpenWorkspaceByPathError> {
    let content = read_to_string(format!("{}/fpx.toml", path))
        .map_err(|_| OpenWorkspaceByPathError::ConfigFileMissing { path: path.clone() })?;

    let config: Config =
        toml::from_str(&content).map_err(|err| OpenWorkspaceByPathError::InvalidConfiguration {
            message: format!("{}", err),
        })?;

    let workspace = Workspace::new(path.clone(), config);
    state.set_workspace(workspace.clone());

    with_store(app, stores, STORE_PATH, |store| {
        let mut recents: Vec<String> = store
            .get(RECENT_WORKSPACES_STORE_KEY)
            .map(|value| {
                value.as_array().map(|arr| {
                    arr.iter()
                        .filter_map(|item| {
                            item.as_str().filter(|s| s == &path).map(|s| s.to_string())
                        })
                        .collect()
                })
            })
            .flatten()
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
pub fn close_workspace(state: State<'_, AppState>) {
    state.close_workspace();
}
