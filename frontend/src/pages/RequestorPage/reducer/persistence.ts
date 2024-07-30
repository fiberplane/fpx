import { useCallback, useEffect, useRef } from "react";
import { useBeforeUnload } from "react-router-dom";
import { z } from "zod";
import { RequestorStateSchema } from "./state";

/**
 * A subset of the RequestorState that is saved to local storage.
 * We don't save things like `routes` since that could be crufty,
 * and will be refetched when the page reloads anyhow
 */
const SavedRequestorStateSchema = RequestorStateSchema.pick({
  path: true,
  method: true,
  requestType: true,
  pathParams: true,
  queryParams: true,
  requestHeaders: true,
  body: true,
});

type SavedRequestorState = z.infer<typeof SavedRequestorStateSchema>;

const isSavedRequestorState = (
  state: unknown,
): state is SavedRequestorState => {
  const result = SavedRequestorStateSchema.safeParse(state);
  if (!result.success) {
    console.error(
      "SavedRequestorState validation failed:",
      result.error.format(),
    );
  }
  return result.success;
};

export function loadUiStateFromLocalStorage(): SavedRequestorState | null {
  const possibleUiState = localStorage.getItem("requestorUiState");
  if (!possibleUiState) {
    return null;
  }

  try {
    const uiState = JSON.parse(possibleUiState);
    if (isSavedRequestorState(uiState)) {
      return uiState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hook that saves the UI state to local storage when the component unmounts,
 * but clears the UI state in local storage when there's a hard refresh
 *
 * Uses a ref to the state to avoid constantly saving to local storage as the state updates
 */
export function useSaveUiState(state: SavedRequestorState) {
  const stateRef = useRef<SavedRequestorState>(state);

  // Update the ref whenever the state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveUiState = useCallback(() => {
    try {
      localStorage.setItem(
        "requestorUiState",
        JSON.stringify(stateRef.current),
      );
    } catch {
      // Ignore errors
      console.error("Error saving state to local storage");
    }
  }, []);

  // When we unmount, save the current state of UI to the browser history
  // This allows us to reload the page state when you press "Back" in the browser, or otherwise navigate back to this page
  useEffect(() => {
    return saveUiState;
  }, [saveUiState]);

  // When the page unloads, remove the UI state from local storage
  // This allows us to clear the UI state when the user closes the tab or hard-navigates away
  useBeforeUnload(
    useCallback(() => {
      // NOTE - `removeItem` doesn't throw errors, so we don't need a try-catch
      localStorage?.removeItem?.("requestorUiState");
    }, []),
  );
}
