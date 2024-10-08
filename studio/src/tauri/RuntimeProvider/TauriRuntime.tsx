import {
  type Workspace,
  type OpenWorkspaceError,
  OpenWorkspaceErrorSchema,
} from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { useState, useEffect } from "react";
import {
  openWorkspace,
  showOpenWorkspaceDialog,
  closeWorkspace,
  getCurrentWorkspace,
} from "../utils";
import { WorkspaceOpenError } from "../WorkspaceOpenError";
import { WorkspaceSelector } from "../WorkspaceSelector";
import { RuntimeContext, type RuntimeProviderProps } from "./RuntimeProvider";
import { useTauriEventHandler } from "../hooks";

export function TauriRuntime({ children }: RuntimeProviderProps) {
  const [workspace, setWorkspace] = useState<Workspace | undefined>();
  const [error, setError] = useState<OpenWorkspaceError | undefined>();

  const handleOpenWorkspaceByPath = useHandler(async (path: string) => {
    const workspace = await openWorkspace(path);
    setWorkspace(workspace);
  });

  const handleOpenDialogRequested = useHandler(() => {
    showOpenWorkspaceDialog()
      .then((workspace) => {
        if (workspace) {
          setWorkspace(workspace);
        }
      })
      .catch((error) => {
        const parsed = OpenWorkspaceErrorSchema.safeParse(error);
        if (parsed.success) {
          return setError(parsed.data);
        }

        throw error;
      });
  });

  const handleCloseWorkspaceRequested = useHandler(() => {
    closeWorkspace();
    setWorkspace(undefined);
  });

  const handleGetApiBaseUrl = useHandler(() => {
    if (workspace) {
      return `http://localhost:${workspace.config.listen_port}`;
    }

    return "";
  });

  useEffect(() => {
    if (workspace === undefined) {
      getCurrentWorkspace().then(setWorkspace);
    }
  }, [workspace]);

  useTauriEventHandler("request-open-dialog", handleOpenDialogRequested);
  useTauriEventHandler(
    "request-close-workspace",
    handleCloseWorkspaceRequested,
  );

  const component = error ? (
    <WorkspaceOpenError error={error} reset={() => setError(undefined)} />
  ) : workspace ? (
    children
  ) : (
    <WorkspaceSelector />
  );

  return (
    <RuntimeContext.Provider
      value={{
        type: "tauri",
        state: { workspace },
        requestCloseWorkspace: handleCloseWorkspaceRequested,
        requestOpenWorkspaceDialog: handleOpenDialogRequested,
        requestOpenWorkspaceByPath: handleOpenWorkspaceByPath,
        requestApiBaseUrl: handleGetApiBaseUrl,
      }}
    >
      {component}
    </RuntimeContext.Provider>
  );
}
