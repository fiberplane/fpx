import type { Workspace } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { invoke } from "@tauri-apps/api";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { WorkspaceSelector } from "./components/WorkspaceSelector";
import { Button } from "./components/ui/button";
import { RUNTIME } from "./constants";

async function getCurrentWorkspace() {
  return await invoke<Workspace | undefined>("get_current_workspace");
}

type DesktopProviderProps = {
  children: ReactNode;
};

export function RuntimeProvider({ children }: DesktopProviderProps) {
  const [workspace, setWorkspace] =
    useState<Awaited<ReturnType<typeof getCurrentWorkspace>>>();

  const closeWorkspace = useHandler(() => {
    invoke("close_workspace");
    setWorkspace(undefined);
  });

  useEffect(() => {
    if (workspace === undefined) {
      getCurrentWorkspace().then(setWorkspace);
    }
  }, [workspace]);

  if (RUNTIME === "browser") {
    return children;
  }

  if (!workspace) {
    return <WorkspaceSelector setWorkspace={setWorkspace} />;
  }

  return (
    <>
      <div className="flex gap-md">
        <pre>{JSON.stringify(workspace.config, null, 2)}</pre>
        <Button onClick={closeWorkspace}>Close workspace</Button>
      </div>
      {children}
    </>
  );
}
