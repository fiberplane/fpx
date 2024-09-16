use crate::models::workspace::{OpenWorkspaceByPathError, Workspace, Config};
use crate::state::AppState;
use std::fs::read_to_string;
use tauri::State;

#[tauri::command]
pub fn get_current_workspace(state: State<'_, AppState>) -> Option<Workspace> {
    state.get_workspace()
}

#[tauri::command]
pub fn open_workspace_by_path(
    path: String,
    state: State<'_, AppState>,
) -> Result<Workspace, OpenWorkspaceByPathError> {
    match read_to_string(format!("{}/fpx.toml", path)) {
        Ok(content) => {
            if let Ok(config) = toml::from_str::<Config>(&content) {
                let workspace = Workspace::new(path, config);
                state.set_workspace(workspace.clone());

                Ok(workspace)
            } else {
                Err(OpenWorkspaceByPathError::InvalidConfiguration)
            }
        }
        Err(_) => Err(OpenWorkspaceByPathError::ConfigFileMissing),
    }
}

#[tauri::command]
pub fn close_workspace(state: State<'_, AppState>) {
    state.close_workspace();
}
