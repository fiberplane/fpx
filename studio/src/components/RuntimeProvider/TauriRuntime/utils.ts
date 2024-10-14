import { WorkspaceSchema } from "@fiberplane/fpx-types";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { z } from "zod";

export async function listRecentWorkspaces() {
  return await invoke<Array<string>>("list_recent_workspaces");
}

export async function openWorkspace(path: string) {
  const response = await invoke("open_workspace_by_path", {
    path,
  });

  return z.lazy(WorkspaceSchema).parse(response);
}

export async function getCurrentWorkspace() {
  const response = await invoke("get_current_workspace");

  return z.lazy(WorkspaceSchema).parse(response);
}

export async function closeWorkspace() {
  return await invoke("close_workspace");
}

export async function showOpenWorkspaceDialog() {
  const selected = await handleDirectorySelection();
  if (!selected) {
    return;
  }

  return await openWorkspace(selected);
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
