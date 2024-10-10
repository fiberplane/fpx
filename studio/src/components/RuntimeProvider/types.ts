import type { AppState } from "@fiberplane/fpx-types";

export type RuntimeType = "tauri" | "unknown";

export type Runtime =
  | {
      type: "tauri";
      state: AppState;
      requestCloseWorkspace: () => void;
      requestOpenWorkspaceDialog: () => void;
      requestOpenWorkspaceByPath: (path: string) => void;
      requestApiBaseUrl: () => string;
    }
  | { type: Exclude<RuntimeType, "tauri"> };
