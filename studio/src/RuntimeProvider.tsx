import { useHandler } from "@fiberplane/hooks";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { WorkspaceSelector } from "./components/WorkspaceSelector";
import { Button } from "./components/ui/button";
import { RUNTIME } from "./constants";
import { getCurrentWorkspace } from "./utils";

type RuntimeProviderProps = {
  children: ReactNode;
};

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const [workspace, setWorkspace] =
    useState<Awaited<ReturnType<typeof getCurrentWorkspace>>>();

  const closeWorkspace = useHandler(() => {
    closeWorkspace();
    setWorkspace(undefined);
  });

  useEffect(() => {
    if (workspace === undefined) {
      getCurrentWorkspace().then(setWorkspace);
    }
  }, [workspace]);

  if (RUNTIME !== "tauri") {
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
