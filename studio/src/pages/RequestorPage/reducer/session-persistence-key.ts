import { objectWithKey } from "@/utils";
import type { SavedRequestorState } from "./state";

// NOTE - This will be unique to the tab/session, and refreshed whenever the page is reloaded.
//        This allows us to NOT load the UI state saved in local storage when the user has Studio open in another tab.
const CURRENT_SESSION_ID = crypto.randomUUID();

// We add this key to the persisted session state to determine if the state is from the current session
const SESSION_ID_KEY = "_persistenceSessionId";

/**
 * Checks if the state in local storage is from the current tab's session
 */
export function isCurrentSessionState(state: unknown) {
  if (objectWithKey(state, SESSION_ID_KEY)) {
    return state[SESSION_ID_KEY] === CURRENT_SESSION_ID;
  }
  return false;
}

/**
 * Adds the session ID to the state to indicate that the persisted state is from the current tab's session
 */
export function addSessionIdToState(state: SavedRequestorState) {
  return {
    ...state,
    // Fixes issue where having multiple tabs open would disrupt the persisted requestor state of other tabs
    [SESSION_ID_KEY]: CURRENT_SESSION_ID,
  };
}
