/**
 * In Hono-node environments, env vars are not available on the `env` object that's passed to `app.fetch`.
 * This helper will also check process.env and Deno.env.toObject() and fallback to that if the env var is not present on the `env` object.
 *
 * If multiple keys are provided, the first key that exists will be returned.
 */
export function getFromEnv(honoEnv: unknown, key: string | string[]) {
  const env = getPlatformSafeEnv(honoEnv);

  if (typeof env !== "object" || env === null) {
    return null;
  }

  const envRecord = env as Record<string, string | null>;

  // Handle single string key
  if (typeof key === "string") {
    return envRecord?.[key] ?? null;
  }

  // Handle array of keys with precedence
  for (const k of key) {
    const value = envRecord?.[k];
    if (value) {
      return value;
    }
  }

  return null;
}

/**
 * Return `process.env` if we're in Node.js, `Deno.env.toObject()` if we're in Deno, otherwise `honoEnv`
 *
 * In the case of Deno, we merge the `Deno.env.toObject()` with the `honoEnv` object.
 *
 * Used to get the env object for accessing and recording env vars.
 * This exists because environment variables are accessed differently across runtimes.
 *
 * @param honoEnv - The env object from the `app.fetch` method.
 * @returns - Environment variables from the appropriate runtime source
 */
export function getPlatformSafeEnv(honoEnv: unknown) {
  const hasProcessEnv = runtimeHasProcessEnv();
  const hasDenoEnv = runtimeHasDenoEnv();
  const isRunningInHonoNode = isHonoNodeEnv(honoEnv);

  if (hasProcessEnv && isRunningInHonoNode) {
    return process.env;
  }

  if (hasDenoEnv) {
    const denoEnv = (globalThis as unknown as DenoEnv).env.toObject();
    return {
      ...denoEnv,
      ...(typeof honoEnv === "object" && honoEnv !== null ? honoEnv : {}),
    };
  }

  return honoEnv;
}

function runtimeHasProcessEnv() {
  if (typeof process !== "undefined" && typeof process.env !== "undefined") {
    return true;
  }
  return false;
}

type DenoEnv = {
  env: {
    toObject: () => Record<string, string>;
  };
};

function runtimeHasDenoEnv(): boolean {
  return (
    typeof (globalThis as unknown as DenoEnv)?.env?.toObject === "function"
  );
}

/**
 * Helper to determine if the env is coming from a Hono node environment.
 *
 * In Node.js, the `env` passed to `app.fetch` is an object with keys "incoming" and "outgoing",
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
