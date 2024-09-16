import type { Workspace } from "@/RuntimeProvider";
import { useHandler } from "@fiberplane/hooks";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { appDataDir } from "@tauri-apps/api/path";
import { Button } from "../ui/button";

async function openWorkspace(path: string) {
  return await invoke<Workspace | undefined>("open_workspace_by_path", {
    path,
  });
}

type WorkspaceSelectorProps = {
  setWorkspace: (workspace: Workspace) => void;
};

export function WorkspaceSelector({ setWorkspace }: WorkspaceSelectorProps) {
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
            const workspace = await openWorkspace(first);
            if (workspace) {
              setWorkspace(workspace);
            }
          }
        }
      } else if (selected === null) {
        //
      } else {
        const workspace = await openWorkspace(selected);
        if (workspace) {
          setWorkspace(workspace);
        }
        // user selected a single directory
      }
    })();
  });

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Button onClick={handleOpen}>Open</Button>
    </div>
  );
}
