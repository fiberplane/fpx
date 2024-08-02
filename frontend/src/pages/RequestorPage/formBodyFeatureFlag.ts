/**
 * Hacky feature flag to enable the form body feature
 *
 * If you want to use this feature, you'll need to executethe following in the browser console:
 *
 * `localStorage.setItem("fpx.requestor.formBodyFeatureFlagEnabled", "true")`
 *
 * Then refresh the page
 *
 * To disable it again, you can run:
 *
 * `localStorage.removeItem("fpx.requestor.formBodyFeatureFlagEnabled")`
 */
export let FORM_BODY_FEATURE_FLAG_ENABLED = false;
try {
  FORM_BODY_FEATURE_FLAG_ENABLED = !!localStorage.getItem(
    "fpx.requestor.formBodyFeatureFlagEnabled",
  );
} catch (e) {
  console.error("Error setting form body feature flag from localStorage", e);
}
