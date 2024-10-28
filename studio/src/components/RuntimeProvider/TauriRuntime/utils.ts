import type { Workspace } from "@fiberplane/fpx-types";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";

export async function listRecentWorkspaces() {
  return await invoke<Array<string>>("list_recent_workspaces");
}

export async function createWorkspaceConfig(listenPort: number, path: string) {
  return await invoke<boolean>("create_workspace_config", {
    listenPort,
    path,
  });
}

export async function openWorkspaceByPath(path: string) {
  return await invoke<Workspace | undefined>("open_workspace_by_path", {
    path,
  });
}

export async function getCurrentWorkspace() {
  return await invoke<Workspace | undefined>("get_current_workspace");
}

export async function closeWorkspace() {
  return await invoke("close_workspace");
}

export async function showOpenWorkspaceDialog() {
  const selected = await handleDirectorySelection();
  if (!selected) {
    return;
  }

  return await openWorkspaceByPath(selected);
}

async function handleDirectorySelection() {
  const selected = await open({
    directory: true,
    multiple: false,
    defaultPath: await appDataDir(),
  });

  if (Array.isArray(selected)) {
    if (selected.length > 0) {
      const [first] = selected;
      if (first) {
        return first;
      }
    }
  } else if (selected !== null) {
    return selected;
  }
}
