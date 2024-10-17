import fs from "node:fs";
import { getIgnoredPaths, shouldIgnoreFile } from "./lib/utils.js";
import logger from "./logger.js";

let debounceTimeout: NodeJS.Timeout | null = null;

function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
) {
  return (...args: Parameters<T>) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Since we are calling the route probe inside a file watcher, we should implement
 * debouncing to avoid spamming the service with requests.
 *
 * HACK - Since we are monitoring ts files, we need a short delay to let the code
 *        for the service recompile.
 */
const debouncedProbeRoutesWithExponentialBackoff = debounce(
  probeRoutesWithExponentialBackoff,
  1500,
);

export function startRouteProbeWatcher(watchDir: string) {
  logger.debug("Starting watcher on directory:", watchDir);

  // Fire off an async probe to the service we want to monitor
  // This will collect information on all routes that the service exposes
  // Which powers a postman-like UI to ping routes and see responses
  const serviceTargetArgument = process.env.FPX_SERVICE_TARGET;
  const probeMaxRetries = 16;
  // Send the initial probe 500ms after startup
  const initialProbeDelay = 500;
  // Add 2.2s delay for all successive probes (e.g., after filesystem change of watched project)
  const probeDelay = 2200;

  debouncedProbeRoutesWithExponentialBackoff(
    serviceTargetArgument,
    probeMaxRetries,
    initialProbeDelay,
  );

  const ignoredPaths = getIgnoredPaths();

  fs.watch(watchDir, { recursive: true }, async (eventType, filename) => {
    if (shouldIgnoreFile(filename, ignoredPaths)) {
      return;
    }

    logger.debug(`File ${filename} ${eventType}, sending a new probe`);

    debouncedProbeRoutesWithExponentialBackoff(
      serviceTargetArgument,
      probeMaxRetries,
      probeDelay,
    );
  });
}

/**
 * Asynchronously probe the routes of a service with exponential backoff.
 * Makes a request to the service root route with the `X-Fpx-Route-Inspector` header set to `enabled`.
 */
async function probeRoutesWithExponentialBackoff(
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
        const backoffDelay = Math.min(delay * 1.2 ** attempt, maxDelay);
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

export async function routerProbe(target: string) {
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
