use crate::models::workspace::Workspace;
use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    workspace: Mutex<Option<Workspace>>,
}

impl AppState {
    pub fn set_workspace(&self, workspace: Workspace) {
        let mut workspace_lock = self.workspace.lock().unwrap();
        *workspace_lock = Some(workspace);
    }

    pub fn close_workspace(&self) {
        let mut workspace_lock = self.workspace.lock().unwrap();
        *workspace_lock = None;
    }

    pub fn is_workspace_open(&self) -> bool {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.is_some()
    }

    pub fn get_workspace(&self) -> Option<Workspace> {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.as_ref().map(|workspace| workspace.clone())
    }

    pub fn get_workspace_path(&self) -> Option<String> {
        let workspace_lock = self.workspace.lock().unwrap();
        workspace_lock.as_ref().map(|ws| ws.path.clone())
    }
}
