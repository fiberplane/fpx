import logger from "./logger.js";

/**
 * Asynchronously probe the routes of a service with exponential backoff.
 * Makes a request to the service root route with the `X-Fpx-Route-Inspector` header set to `enabled`.
 */
export async function probeRoutesWithExponentialBackoff(
  serviceArg: string | number | undefined,
  maxRetries: number,
  delay = 1000,
  maxDelay = 16000,
) {
  const serviceUrl = resolveServiceArg(serviceArg);
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await routerProbe(serviceUrl);
      logger.debug(`Detected routes for ${serviceUrl} successfully!`);
      return;
    } catch (error) {
      attempt++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.debug(
        `⚠️ Failed to detect routes for api ${serviceUrl}:`,
        errorMessage,
      );
      if (attempt < maxRetries) {
        const backoffDelay = Math.min(delay * 2 ** attempt, maxDelay);
        logger.debug(`  Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      } else {
        logger.error(
          "⚠️ Failed to detect api routes. Giving up! Restart fpx to try again.",
        );
      }
    }
  }
}

async function routerProbe(target: string) {
  const headers = new Headers();
  headers.append("X-Fpx-Route-Inspector", "enabled");
  return await fetch(target, {
    method: "GET",
    headers,
  });
}

/**
 * Helper function for resolving the service to probe, given a string or number argument.
 * See the tests for expected behavior, but here are some examples:
 *
 * - `resolveServiceArg()` => "http://localhost:8787"
 * - `resolveServiceArg(8787)` => "http://localhost:8787"
 * - `resolveServiceArg("8787")` => "http://localhost:8787"
 * - `resolveServiceArg("1234")` => "http://localhost:1234"
 * - `resolveServiceArg("http://localhost:1234")` => "http://localhost:1234"
 * - `resolveServiceArg("invalid", "http://localhost:4321")` => "http://localhost:4321"
 */
export function resolveServiceArg(
  serviceArg: string | number | undefined,
  fallback = "http://localhost:8787",
) {
  if (!serviceArg) {
    return fallback;
  }
  if (typeof serviceArg === "string" && serviceArg.startsWith("http")) {
    return serviceArg;
  }
  if (typeof serviceArg === "number") {
    return `http://localhost:${serviceArg}`;
  }
  const targetPort = Number.parseInt(serviceArg, 10);
  if (!targetPort) {
    logger.error(
      `Invalid service argument ${serviceArg}. Using default ${fallback}.`,
    );
    return fallback;
  }
  return `http://localhost:${targetPort}`;
}
