import { safeParseJson } from "@/utils";
import { z } from "zod";
import type { StateCreator } from "zustand";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import type { KeyValueParameter } from "../types";
import type { StudioState } from "./types";

const SETTINGS_STORAGE_KEY = "playground_settings";

const AuthorizationBaseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export const AuthorizationBearerSchema = AuthorizationBaseSchema.extend({
  type: z.literal("bearer"),
  token: z.string(),
});
export type AuthorizationBearer = z.infer<typeof AuthorizationBearerSchema>;

const AuthorizationBasicSchema = AuthorizationBaseSchema.extend({
  type: z.literal("basic"),
  username: z.string(),
  password: z.string(),
});
export type AuthorizationBasic = z.infer<typeof AuthorizationBasicSchema>;

export const AuthorizationSchema = z.union([
  AuthorizationBasicSchema,
  AuthorizationBearerSchema,
]);
export type Authorization = z.infer<typeof AuthorizationSchema>;
const AuthorizationsSchema = z.array(AuthorizationSchema);

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
  authorizations: Authorization[];
  useMockApiSpec: boolean;
} => {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) {
    return {
      persistentAuthHeaders: getInitialAuthHeaders(),
      authorizations: [],
      useMockApiSpec: false,
    };
  }

  const parsed = safeParseJson(stored);
  if (!parsed) {
    return {
      persistentAuthHeaders: getInitialAuthHeaders(),
      authorizations: [],
      useMockApiSpec: false,
    };
  }

  const result = AuthorizationsSchema.safeParse(parsed.authorizations);
  const authorizations = result.success ? result.data : [];
  return {
    persistentAuthHeaders: enforceTerminalDraftParameter(
      parsed.persistentAuthHeaders || [],
    ),
    authorizations,
    useMockApiSpec: parsed.useMockApiSpec || false,
  };
};

export interface SettingsSlice {
  // Auth headers that should be included in every request
  persistentAuthHeaders: KeyValueParameter[];
  // Auth tokens that can be used in requests
  // These are stored in local storage
  authorizations: Authorization[];
  // Whether to use mock API spec instead of loading programmatically
  useMockApiSpec: boolean;

  // Actions
  addAuthorization: (
    authorization: Authorization & Pick<Partial<Authorization>, "id">,
  ) => void;
  updateAuthorization: (authorization: Authorization) => void;
  removeAuthorization: (id: string) => void;
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
    addAuthorization: (
      authorization: Authorization & Pick<Partial<Authorization>, "id">,
    ) => {
      const { id = crypto.randomUUID() } = authorization;
      const newAuthorization = { ...authorization, id };
      set((state) => {
        state.authorizations.push(newAuthorization);
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({
            ...state,
            authorizations: state.authorizations,
          }),
        );
      });
    },
    updateAuthorization: (authorization: Authorization) => {
      set((state) => {
        const index = state.authorizations.findIndex(
          (auth) => auth.id === authorization.id,
        );
        if (index === -1) {
          return;
        }

        state.authorizations[index] = authorization;
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({
            ...state,
            authorizations: state.authorizations,
          }),
        );
      });
    },
    removeAuthorization: (id: string) => {
      set((state) => {
        state.authorizations = state.authorizations.filter(
          (auth) => auth.id !== id,
        );
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({
            ...state,
            authorizations: state.authorizations,
          }),
        );
      });
    },
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
