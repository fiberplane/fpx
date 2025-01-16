import type { StateCreator } from "zustand";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import type { KeyValueParameter } from "../types";
import type { StudioState } from "./types";

const getInitialAuthHeaders = () =>
  enforceTerminalDraftParameter([
    {
      id: crypto.randomUUID(),
      key: "",
      value: "",
      enabled: false,
    },
  ]);

export interface SettingsSlice {
  // Auth headers that should be included in every request
  persistentAuthHeaders: KeyValueParameter[];
  // Whether to use mock API spec instead of loading programmatically
  useMockApiSpec: boolean;

  // Actions
  setPersistentAuthHeaders: (headers: KeyValueParameter[]) => void;
  setUseMockApiSpec: (useMock: boolean) => void;
}

export const settingsSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  SettingsSlice
> = (set) => ({
  persistentAuthHeaders: getInitialAuthHeaders(),
  useMockApiSpec: false,

  setPersistentAuthHeaders: (headers) =>
    set((state) => {
      // Always ensure there's at least one draft parameter
      state.persistentAuthHeaders = enforceTerminalDraftParameter(headers);
    }),

  setUseMockApiSpec: (useMock) =>
    set((state) => {
      state.useMockApiSpec = useMock;
    }),
});
