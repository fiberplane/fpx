import { ENV_FIBERPLANE_ENVIRONMENT } from "../constants";
import { getFromEnv } from "./env";

/**
 * The client library needs to be aware of whether it is in production. In production, we will NOT send certain sensitive data (see below).
 *
 * To determine whether we're in "local" mode, the library first checks:
 * - Whether the FIBERPLANE_ENVIRONMENT env var === "local"
 * - If there is no FIBERPLANE_ENVIRONMENT set, then we check if FIBERPLANE_OTEL_ENDPOINT contains localhost.
 *
 */
export function isInLocalMode(
  env: Record<string, string | null> | null | undefined,
  isLocalFallback: boolean,
): boolean {
  const fiberplaneEnv = getFromEnv(env, ENV_FIBERPLANE_ENVIRONMENT);
  // If the FIBERPLANE_ENVIRONMENT env var is present and it is not nullish,
  // then we use it to determine if we're in local mode.
  if (fiberplaneEnv != null) {
    return fiberplaneEnv === "local";
  }

  return isLocalFallback;
}
