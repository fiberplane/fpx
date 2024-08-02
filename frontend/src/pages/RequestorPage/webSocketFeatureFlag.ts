/**
 * Hacky feature flag to disable websockets for now, until we can iron out the UX
 *
 * If you want to use this feature, you'll need to execute the following in the browser console:
 *
 * `localStorage.setItem("fpx.requestor.webSocketsEnabled", "true")`
 *
 * Then refresh the page
 *
 * To disable it again, you can run:
 *
 * `localStorage.removeItem("fpx.requestor.webSocketsEnabled")`
 */
export let WEBSOCKETS_ENABLED = false;
try {
  WEBSOCKETS_ENABLED = !!localStorage.getItem(
    "fpx.requestor.webSocketsEnabled",
  );
} catch (e) {
  console.error("Error setting websockets feature flag from localStorage", e);
}
