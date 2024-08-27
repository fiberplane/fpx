import { useCallback, useEffect, useRef } from "react";
import { useBeforeUnload } from "react-router-dom";
import {
  LOCAL_STORAGE_KEY,
  type SavedRequestorState,
  SavedRequestorStateSchema,
} from "./state";

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
      const state = SavedRequestorStateSchema.parse(stateRef.current);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
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
      localStorage?.removeItem?.(LOCAL_STORAGE_KEY);
    }, []),
  );
}
