import {
  type AppState,
  type OpenWorkspaceByPathError,
  OpenWorkspaceByPathErrorSchema,
  type Workspace,
} from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { listen } from "@tauri-apps/api/event";
import type { ReactNode } from "react";
import { createContext, useEffect, useState } from "react";
import { RUNTIME } from "../constants";
import {
  closeWorkspace,
  getCurrentWorkspace,
  showOpenWorkspaceDialog,
} from "../utils";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { WorkspaceOpenError } from "./WorkspaceOpenError";
import { WorkspaceShell } from "./WorkspaceShell";

type RuntimeProviderProps = {
  children: ReactNode;
};

type Runtime =
  | {
    type: "tauri";
    state: AppState;
    requestCloseWorkspace: () => void;
    requestOpenWorkspaceDialog: () => void;
  }
  | { type: "unknown" };

export const RuntimeContext = createContext<Runtime | null>(null);

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  switch (RUNTIME) {
    case "tauri":
      return <TauriRuntime>{children}</TauriRuntime>;
    default:
      return <DefaultRuntime>{children}</DefaultRuntime>;
  }
}

function TauriRuntime({ children }: RuntimeProviderProps) {
  const [workspace, setWorkspace] = useState<Workspace | undefined>();
  const [error, setError] = useState<OpenWorkspaceByPathError | undefined>();

  const handleOpenDialogRequested = useHandler(() => {
    showOpenWorkspaceDialog()
      .then((workspace) => {
        if (workspace) {
          setWorkspace(workspace);
        }
      })
      .catch((error) => {
        const parsed = OpenWorkspaceByPathErrorSchema.safeParse(error);
        if (parsed.success) {
          return setError(parsed.data);
        }

        throw error;
      });
  });

  const handleCloseWorkspace = useHandler(() => {
    closeWorkspace();
    setWorkspace(undefined);
  });

  useEffect(() => {
    if (workspace === undefined) {
      getCurrentWorkspace().then(setWorkspace);
    }
  }, [workspace]);

  useEffect(() => {
    const handler = listen<string>(
      "request-open-dialog",
      handleOpenDialogRequested,
    );
    return () => {
      handler.then((unlisten) => unlisten());
    };
  }, [handleOpenDialogRequested]);

  if (RUNTIME !== "tauri") {
    return children;
  }

  const component = error ? (
    <WorkspaceOpenError error={error} reset={() => setError(undefined)} />
  ) : workspace ? (
    <WorkspaceShell workspace={workspace}>{children}</WorkspaceShell>
  ) : (
    <WorkspaceSelector />
  );

  return (
    <RuntimeContext.Provider
      value={{
        type: "tauri",
        state: { workspace },
        requestCloseWorkspace: handleCloseWorkspace,
        requestOpenWorkspaceDialog: handleOpenDialogRequested,
      }}
    >
      {component}
    </RuntimeContext.Provider>
  );
}

function DefaultRuntime({ children }: RuntimeProviderProps) {
  return (
    <RuntimeContext.Provider value={{ type: "unknown" }}>
      {children}
    </RuntimeContext.Provider>
  );
}
