import type { NeonDbError } from "@neondatabase/serverless";
import type { Context } from "hono";
import { replaceFetch } from "./replace-fetch";
import { RECORDED_CONSOLE_METHODS, log } from "./request-logger";
import {
  errorToJson,
  extractCallerLocation,
  generateUUID,
  getFriendlyLinkToMizuIfMessageIsResponse,
  neonDbErrorToJson,
  polyfillWaitUntil,
  shouldIgnoreMizuLog,
  shouldPrettifyMizuLog,
  tryPrettyPrintLoggerLog,
} from "./utils";

type Config = {
  endpoint: string;
  /** Name of service (not in use, but will be helpful later) */
  service?: string;
  /** Use `libraryDebugMode` to log into the terminal what we are sending to the Mizu server on each request/response */
  libraryDebugMode?: boolean;
  monitor: {
    /** Send data to mizu about each fetch call made during a handler's lifetime */
    fetch: boolean;
    // TODO - implement this control/feature
    logging: boolean;
    /** Send data to mizu about each incoming request and outgoing response */
    requests: boolean;
  };
};

type CreateConfig = (context: Context) => Config;

const defaultCreateConfig = (c: Context) => {
  return {
    endpoint: c.env?.MIZU_ENDPOINT ?? "http://localhost:8788/v0/logs",
    service: c.env?.SERVICE_NAME || "unknown",
    libraryDebugMode: c.env?.LIBRARY_DEBUG_MODE,
    monitor: {
      fetch: true,
      logging: true,
      requests: true,
    },
  };
};

export function createHonoMiddleware(options?: {
  createConfig: CreateConfig;
}) {
  const createConfig = options?.createConfig ?? defaultCreateConfig;
  return async function honoMiddleware(c: Context, next: () => Promise<void>) {
    const {
      endpoint,
      service,
      libraryDebugMode,
      monitor: {
        fetch: monitorFetch,
        // TODO - implement these controls/features
        // logging: monitorLogging,
        requests: monitorRequests,
      },
    } = createConfig(c);
    const ctx = c.executionCtx;

    // NOTE - Polyfilling `waitUntil` is probably not necessary for Cloudflare workers, but could be good for vercel envs
    //         https://github.com/highlight/highlight/pull/6480
    polyfillWaitUntil(ctx);

    const teardownFunctions: Array<() => void> = [];

    const { originalFetch, undo: undoReplaceFetch } = replaceFetch({
      skipMonkeyPatch: !monitorFetch,
    });
    // We need to undo our monkeypatching since workers can operate in a shared environment
    // This is similar to how we need to undo our monkeypatching of `console.*` methods (see HACK comment below)
    teardownFunctions.push(undoReplaceFetch);

    // TODO - (future) Take the traceId from headers but then fall back to uuid here?
    const traceId = generateUUID();

    // We monkeypatch `console.*` methods because it's the only way to send consumable logs locally without setting up an otel colletor
    for (const level of RECORDED_CONSOLE_METHODS) {
      const originalConsoleMethod = console[level];
      // HACK - We need to expose a teardown function after requests terminate, so that we can undo our monkey patching
      //        Otherwise, each successive request ends up monkey patching `console.*`, using the previously monkey patched version!!!
      teardownFunctions.push(() => {
        console[level] = originalConsoleMethod;
      });

      // TODO - Fix type of `originalMessage`, since devs could really put anything in there...
      console[level] = (
        originalMessage: string | Error | NeonDbError,
        ...args: unknown[]
      ) => {
        const timestamp = new Date().toISOString();

        const callerLocation = extractCallerLocation(
          (new Error().stack ?? "").split("\n")[2],
        );

        let message = originalMessage;
        if (typeof message !== "string" && message.name === "NeonDbError") {
          message = JSON.stringify(neonDbErrorToJson(message as NeonDbError));
        }
        if (message instanceof Error) {
          message = JSON.stringify(errorToJson(message));
        }

        const payload = {
          level,
          traceId,
          service,
          message,
          args,
          callerLocation,
          timestamp,
        };
        ctx.waitUntil(
          // Use `originalFetch` to avoid an infinite loop of logging to mizu
          // If we use our monkeyPatched version, then each fetch logs to mizu,
          // which triggers another fetch to log to mizu, etc.
          originalFetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }),
        );

        const applyArgs = args?.length ? [message, ...args] : [message];

        // In practice, we ignore any additional logging to the console for fetch requests themselves
        // Otherwise, things get real noisy
        if (shouldIgnoreMizuLog(applyArgs)) {
          return;
        }

        if (!libraryDebugMode && shouldPrettifyMizuLog(applyArgs)) {
          // Optionally log a link to the mizu dashboard for the "response" log
          // Sorry, I couldn't think of a longer name for the helper function
          const linkToMizuUi = getFriendlyLinkToMizuIfMessageIsResponse({
            message,
            traceId,
            mizuEndpoint: endpoint,
          });

          // Try parsing the message as json and extracting all the fields we care about logging prettily
          tryPrettyPrintLoggerLog(originalConsoleMethod, message, linkToMizuUi);
        } else {
          originalConsoleMethod.apply(originalConsoleMethod, applyArgs);
        }
      };
    }

    if (monitorRequests) {
      await log(c, next);
    } else {
      await next();
    }

    for (const teardownFunction of teardownFunctions) {
      teardownFunction();
    }
  };
}
