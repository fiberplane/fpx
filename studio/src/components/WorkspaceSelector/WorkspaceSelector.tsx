import type { Workspace } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { appDataDir } from "@tauri-apps/api/path";
import { useState } from "react";
import { Button } from "../ui/button";

type OpenWorkspaceByPathError = "ConfigFileMissing" | "InvalidConfiguration";

async function openWorkspace(path: string) {
  return await invoke<Workspace | undefined>("open_workspace_by_path", {
    path,
  });
}

type WorkspaceSelectorProps = {
  setWorkspace: (workspace: Workspace) => void;
};

export function WorkspaceSelector({ setWorkspace }: WorkspaceSelectorProps) {
  const [error, setError] = useState<OpenWorkspaceByPathError | undefined>();

  const openFile = useHandler(async (path: string) => {
    try {
      const workspace = await openWorkspace(path);
      if (workspace) {
        setWorkspace(workspace);
      }
    } catch (error) {
      switch (error) {
        case "ConfigFileMissing":
        case "InvalidConfiguration":
          setError(error);
          break;
      }
    }
  });

  const handleOpen = useHandler(() => {
    (async () => {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: await appDataDir(),
      });

      if (Array.isArray(selected)) {
        if (selected.length > 0) {
          const [first] = selected;
          if (first) {
            openFile(first);
          }
        }
      } else if (selected !== null) {
        openFile(selected);
      }
    })();
  });

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      {error}
      <Button onClick={handleOpen}>Open</Button>
    </div>
  );
}
