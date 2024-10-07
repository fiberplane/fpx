import {
  type AppState,
  type OpenWorkspaceError,
  OpenWorkspaceErrorSchema,
  type Workspace,
} from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { listen } from "@tauri-apps/api/event";
import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useState } from "react";
import { RUNTIME } from "../constants";
import { WorkspaceOpenError } from "./WorkspaceOpenError";
import { WorkspaceSelector } from "./WorkspaceSelector";
import {
  closeWorkspace,
  getCurrentWorkspace,
  openWorkspace,
  showOpenWorkspaceDialog,
} from "./utils";

type RuntimeProviderProps = {
  children: ReactNode;
};

type Runtime =
  | {
      type: "tauri";
      state: AppState;
      requestCloseWorkspace: () => void;
      requestOpenWorkspaceDialog: () => void;
      requestOpenWorkspaceByPath: (path: string) => void;
      requestApiBaseUrl: () => string;
    }
  | { type: "unknown"; requestApiBaseUrl: () => string };

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

  const handleCloseWorkspace = useHandler(() => {
    closeWorkspace();
    setWorkspace(undefined);
  });

  const handleGetApiBaseUrl = useCallback(() => {
    if (workspace) {
      return `http://localhost:${workspace.config.listen_port}`;
    }

    return "";
  }, [workspace]);

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

  useEffect(() => {
    const handler = listen<string>(
      "request-close-workspace",
      handleCloseWorkspace,
    );
    return () => {
      handler.then((unlisten) => unlisten());
    };
  }, [handleCloseWorkspace]);

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
        requestCloseWorkspace: handleCloseWorkspace,
        requestOpenWorkspaceDialog: handleOpenDialogRequested,
        requestOpenWorkspaceByPath: handleOpenWorkspaceByPath,
        requestApiBaseUrl: handleGetApiBaseUrl,
      }}
    >
      {component}
    </RuntimeContext.Provider>
  );
}

function DefaultRuntime({ children }: RuntimeProviderProps) {
  const handleGetApiBaseUrl = () => "";

  return (
    <RuntimeContext.Provider
      value={{ type: "unknown", requestApiBaseUrl: handleGetApiBaseUrl }}
    >
      {children}
    </RuntimeContext.Provider>
  );
}
