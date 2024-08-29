/**
 * Helper to determine if we should fallback to process.env to record env vars.
 *
 * @param honoEnv - The env object from the `app.fetch` method.
 * @returns - True if we should fallback to process.env, false otherwise.
 */
export function shouldFallbackToProcessEnv(honoEnv: unknown) {
  const hasProcessEnv = runtimeHasProcessEnv();
  const isRunningInHonoNode = isHonoNodeEnv(honoEnv);
  console.log("hasProcessEnv", hasProcessEnv);
  console.log("isRunningInHonoNode", isRunningInHonoNode);
  return hasProcessEnv && isRunningInHonoNode;
}

export function runtimeHasProcessEnv() {
  if (typeof process !== "undefined" && typeof process.env !== "undefined") {
    return true;
  }
  return false;
}

/**
 * Helper to determine if the env is coming from a Hono node environment.
 *
 * In node.js, the `env` passed to `app.fetch` is an object with keys "incoming" and "outgoing",
 * one of which has circular references. We don't want to serialize this.
 */
function isHonoNodeEnv(env: unknown) {
  if (typeof env !== "object" || env === null) {
    return false;
  }
  const envKeys = Object.keys(env).map((key) => key.toLowerCase());
  return (
    envKeys.length === 2 &&
    envKeys.includes("incoming") &&
    envKeys.includes("outgoing")
  );
}
