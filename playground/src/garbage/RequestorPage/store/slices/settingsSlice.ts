import type { StateCreator } from "zustand";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import type { KeyValueParameter } from "../types";
import type { StudioState } from "./types";

const SETTINGS_STORAGE_KEY = "playground_settings";

const getInitialAuthHeaders = () =>
  enforceTerminalDraftParameter([
    {
      id: crypto.randomUUID(),
      key: "",
      value: "",
      enabled: false,
    },
  ]);

const loadSettingsFromStorage = (): {
  persistentAuthHeaders: KeyValueParameter[];
  useMockApiSpec: boolean;
} => {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) {
    return {
      persistentAuthHeaders: getInitialAuthHeaders(),
      useMockApiSpec: false,
    };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      persistentAuthHeaders: enforceTerminalDraftParameter(
        parsed.persistentAuthHeaders || [],
      ),
      useMockApiSpec: parsed.useMockApiSpec || false,
    };
  } catch {
    return {
      persistentAuthHeaders: getInitialAuthHeaders(),
      useMockApiSpec: false,
    };
  }
};

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
> = (set) => {
  const initialState = loadSettingsFromStorage();

  return {
    ...initialState,

    setPersistentAuthHeaders: (headers) =>
      set((state) => {
        // Always ensure there's at least one draft parameter
        state.persistentAuthHeaders = enforceTerminalDraftParameter(headers);
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({
            ...state,
            persistentAuthHeaders: state.persistentAuthHeaders,
          }),
        );
      }),

    setUseMockApiSpec: (useMock) =>
      set((state) => {
        state.useMockApiSpec = useMock;
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({
            ...state,
            useMockApiSpec: useMock,
          }),
        );
      }),
  };
};
