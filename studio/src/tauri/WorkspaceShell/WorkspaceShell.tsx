import type { Workspace } from "@fiberplane/fpx-types";
import { useContext, type ReactNode } from "react";
import { RuntimeContext } from "../RuntimeProvider";
import { Button } from "@/components/ui/button";

type WorkspaceShellProps = {
  children: ReactNode;
  workspace: Workspace;
};

export function WorkspaceShell({ children, workspace }: WorkspaceShellProps) {
  const runtime = useContext(RuntimeContext);
  if (runtime?.type !== "tauri") {
    return null;
  }

  return (
    <>
      <div className="flex gap-md">
        <pre>{JSON.stringify(workspace, null, 2)}</pre>
        <Button onClick={runtime.requestCloseWorkspace}>Close workspace</Button>
      </div>
      {children}
    </>
  );
}
