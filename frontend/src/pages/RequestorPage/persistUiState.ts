import { useCallback, useEffect, useMemo } from "react";
import { useBeforeUnload } from "react-router-dom";
import { z } from "zod";
import { KeyValueParameterSchema } from "./KeyValueForm";

const PersistedUiStateSchema = z.object({
  route: z
    .object({
      method: z.string(),
      path: z.string(),
    })
    .nullable(),
  path: z.string(),
  method: z.string(),
  body: z.string().optional(),
  pathParams: z.array(KeyValueParameterSchema).optional(),
  queryParams: z.array(KeyValueParameterSchema),
  requestHeaders: z.array(KeyValueParameterSchema),
});

export type PersistedUiState = z.infer<typeof PersistedUiStateSchema>;

const isPersistedUiState = (value: unknown): value is PersistedUiState => {
  const isValid = PersistedUiStateSchema.safeParse(value).success;
  return isValid;
};

function loadUiStateFromLocalStorage() {
  const possibleUiState = localStorage.getItem("requestorUiState");
  if (!possibleUiState) {
    return null;
  }

  try {
    const uiState = JSON.parse(possibleUiState);
    if (isPersistedUiState(uiState)) {
      return uiState;
    }
    return null;
  } catch {
    return null;
  }
}

export function usePersistedUiState() {
  const uiState = useMemo(() => loadUiStateFromLocalStorage(), []);
  return uiState ?? undefined;
}

export function useSaveUiState({
  route,
  path,
  method,
  body,
  pathParams,
  queryParams,
  requestHeaders,
}: PersistedUiState) {
  const saveUiState = useCallback(() => {
    const historyState: PersistedUiState = {
      route,
      path,
      method,
      body,
      pathParams,
      queryParams,
      requestHeaders,
    };

    try {
      localStorage.setItem("requestorUiState", JSON.stringify(historyState));
    } catch {
      // Ignore
    }
  }, [route, path, method, body, pathParams, queryParams, requestHeaders]);

  // When this component unloads, save the UI state to local storage
  useEffect(() => {
    return () => {
      saveUiState();
    };
  });

  // When the page unloads, remove the UI state from local storage
  // ((Allows clearing the UI state when the user closes the tab or hard-navigates away))
  useBeforeUnload(
    useCallback(() => {
      try {
        localStorage.removeItem("requestorUiState");
      } catch {
        // Ignore
      }
    }, []),
  );
}
