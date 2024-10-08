import type { AppState } from "@fiberplane/fpx-types";
import type { ReactNode } from "react";
import { createContext } from "react";
import { RUNTIME } from "../../constants";
import { TauriRuntime } from "./TauriRuntime";
import { DefaultRuntime } from "./DefaultRuntime";

export type RuntimeProviderProps = {
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
