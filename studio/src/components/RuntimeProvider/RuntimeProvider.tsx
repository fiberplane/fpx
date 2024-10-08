import type { ReactNode } from "react";
import { createContext } from "react";
import { RUNTIME } from "../../constants";
import { DefaultRuntime } from "./DefaultRuntime";
import { TauriRuntime } from "./TauriRuntime";
import type { Runtime } from "./types";

export type RuntimeProviderProps = {
  children: ReactNode;
};

export const RuntimeContext = createContext<Runtime | null>(null);

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  switch (RUNTIME) {
    case "tauri":
      return <TauriRuntime>{children}</TauriRuntime>;
    default:
      return <DefaultRuntime>{children}</DefaultRuntime>;
  }
}
