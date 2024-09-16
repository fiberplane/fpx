import type { Workspace } from "@fiberplane/fpx-types";
import { invoke } from "@tauri-apps/api";

export async function openWorkspace(path: string) {
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
