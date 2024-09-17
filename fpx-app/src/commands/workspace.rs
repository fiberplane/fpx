use crate::models::workspace::{Config, OpenWorkspaceByPathError, Workspace};
use crate::state::AppState;
use crate::STORE_PATH;
use serde_json::Value;
use std::fs::read_to_string;
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_store::{with_store, StoreCollection};

const RECENT_WORKSPACES_STORE_KEY: &str = "recent_workspaces";

#[tauri::command]
pub fn list_recent_workspaces<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection<R>>,
) -> Vec<String> {
    if let Ok(recent_projects) = with_store(app, stores, STORE_PATH, |store| {
        if let Some(Value::Array(arr)) = store.get(RECENT_WORKSPACES_STORE_KEY) {
            let vec_of_strings: Vec<String> = arr
                .iter()
                .filter_map(|item| item.as_str().map(|s| s.to_string()))
                .collect();

            return Ok(vec_of_strings);
        }

        Ok(vec![])
    }) {
        return recent_projects;
    }

    vec![]
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
    match read_to_string(format!("{}/fpx.toml", path)) {
        Ok(content) => match toml::from_str::<Config>(&content) {
            Ok(config) => {
                let workspace = Workspace::new(path.clone(), config);
                state.set_workspace(workspace.clone());

                with_store(app, stores, STORE_PATH, |store| {
                    let mut recents = match store.get(RECENT_WORKSPACES_STORE_KEY) {
                        Some(Value::Array(arr)) => {
                            let vec_of_strings: Vec<String> = arr
                                .iter()
                                .filter_map(|item| {
                                    if let Some(s) = item.as_str() {
                                        if s != path {
                                            return Some(s.to_string());
                                        }
                                    }
                                    None
                                })
                                .collect();

                            vec_of_strings
                        }
                        _ => vec![],
                    };

                    recents.insert(0, path);

                    store
                        .insert(RECENT_WORKSPACES_STORE_KEY.into(), recents.into())
                        .unwrap();

                    store.save()
                })
                .unwrap();

                Ok(workspace)
            }
            Err(error) => Err(OpenWorkspaceByPathError::InvalidConfiguration {
                message: format!("{}", error),
            }),
        },
        Err(_) => Err(OpenWorkspaceByPathError::ConfigFileMissing { path }),
    }
}

#[tauri::command]
pub fn close_workspace(state: State<'_, AppState>) {
    state.close_workspace();
}
