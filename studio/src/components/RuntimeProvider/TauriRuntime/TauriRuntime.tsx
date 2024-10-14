import {
  type OpenWorkspaceError,
  OpenWorkspaceErrorSchema,
  type Workspace,
} from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { useEffect, useState } from "react";
import { RuntimeContext, type RuntimeProviderProps } from "../RuntimeProvider";
import { WorkspaceOpenError } from "./WorkspaceOpenError";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { useTauriEventHandler } from "./hooks";
import {
  closeWorkspace,
  getCurrentWorkspace,
  openWorkspace,
  showOpenWorkspaceDialog,
} from "./utils";
import { z } from "zod";

export function TauriRuntime({ children }: RuntimeProviderProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<OpenWorkspaceError | undefined>();

  const handleOpenWorkspaceByPath = useHandler(async (path: string) => {
    const workspace = await openWorkspace(path);
    setWorkspace(workspace);
  });

  const handleOpenDialogRequested = useHandler(async () => {
    try {
      const workspace = await showOpenWorkspaceDialog();
      if (workspace) {
        setWorkspace(workspace);
      }
    } catch (error) {
      const parsed = z.lazy(OpenWorkspaceErrorSchema).safeParse(error);
      if (parsed.success) {
        return setError(parsed.data);
      }

      throw error;
    }
  });

  const handleCloseWorkspaceRequested = useHandler(() => {
    closeWorkspace();
    setWorkspace(null);
  });

  const handleGetApiBaseUrl = useHandler(() => {
    if (workspace) {
      return `http://localhost:${workspace.api_port}`;
    }

    return "";
  });

  useEffect(() => {
    if (workspace === null) {
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
