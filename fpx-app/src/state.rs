use crate::models::workspace::Workspace;
use schemars::JsonSchema;
use std::sync::Mutex;

#[derive(JsonSchema, Default)]
pub struct AppState {
    workspace: Mutex<Option<Workspace>>,
}

impl AppState {
    pub fn set_workspace(&self, workspace: Workspace) {
        let mut workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.replace(workspace);
    }

    pub fn close_workspace(&self) {
        let mut workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.take();
    }

    pub fn get_workspace(&self) -> Option<Workspace> {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.as_ref().cloned()
    }
}
