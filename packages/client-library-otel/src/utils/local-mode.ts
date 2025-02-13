import { ENV_FIBERPLANE_ENVIRONMENT } from "../constants";
import { getFromEnv } from "./env";

export function isInLocalMode(
  env: Record<string, string | null> | null | undefined,
  isLocal: boolean,
) {
  const fiberplaneEnv = getFromEnv(env, ENV_FIBERPLANE_ENVIRONMENT);
  if (fiberplaneEnv === "local") {
    return true;
  }
  return isLocal;
}
