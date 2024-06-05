import type { NeonDbError } from "@neondatabase/serverless";
import type { Context } from "hono";
import { replaceFetch } from "./replace-fetch";
import { RECORDED_CONSOLE_METHODS, log } from "./request-logger";
import {
  errorToJson,
  extractCallerLocation,
  generateUUID,
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
    // TODO - implement this control/feature
    fetch: boolean;
    // TODO - implement this control/feature
    logging: boolean;
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
        // requests: monitorRequests,
      },
    } = createConfig(c);
    const ctx = c.executionCtx;

    // NOTE - Polyfilling `waitUntil` is probably not necessary for Cloudflare workers, but could be good for vercel envs
    //         https://github.com/highlight/highlight/pull/6480
    polyfillWaitUntil(ctx);

    const teardownFunctions: Array<() => void> = [];

    const { originalFetch, undo: undoReplaceFetch } = replaceFetch();
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
          originalFetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }),
        );
        const applyArgs = args?.length ? [message, ...args] : [message];
        if (shouldIgnoreMizuLog(applyArgs)) {
          return;
        }
        if (!libraryDebugMode && shouldPrettifyMizuLog(applyArgs)) {
          // HACK - Optionally log a link to the mizu dashboard for the "response" log
          let friendlyLink: undefined | string;
          if (isMessageFinalEvent(message)) {
            // HACK - host needs to be 5173 locally, but whatever MIZU_ENDPOINT host is when package is distributed...
            friendlyLink = `Inspect in Mizu: http://localhost:8788/requests/${traceId}`;
          }
          // HACK - Try parsing the message as json and extracting all the fields we care about logging prettily
          tryPrettyPrintLoggerLog(originalConsoleMethod, message, friendlyLink);
        } else {
          originalConsoleMethod.apply(originalConsoleMethod, applyArgs);
        }
      };
    }

    if (monitorFetch) {
      await log(c, next);
    } else {
      await next();
    }

    for (const teardownFunction of teardownFunctions) {
      teardownFunction();
    }
  };
}

/**
 * Utility can be used to determine if a message is a final event in a request/response lifecycle
 * This means the `lifecycle` property is "response" as of writing
 */
function isMessageFinalEvent(message: string) {
  try {
    const parsed = JSON.parse(message);
    return parsed.lifecycle === "response";
  } catch {
    return false;
  }
}
