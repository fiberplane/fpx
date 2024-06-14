import type { NeonDbError } from "@neondatabase/serverless";
import type { Context, Hono } from "hono";
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
  tryCreateFriendlyLink,
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

export function createHonoMiddleware(
  app?: Hono,
  options?: {
    createConfig: CreateConfig;
  },
) {
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

    if (!app) {
      // Logging here before we patch the console.* methods so we don't cause trouble
      console.log(
        "Hono object was not provided to createHonoMiddleware, skipping route inspection...",
      );
    }

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

        const routeInspectorHeader = c.req.header("X-Fpx-Route-Inspector");

        const routes = app
          ? app?.routes.map((route) => ({
              method: route.method,
              path: route.path,
              handler: route.handler.toString(),
              handlerType: route.handler.length < 2 ? "route" : "middleware",
            }))
          : [];

        const payload = {
          level,
          traceId,
          service,
          message,
          args,
          callerLocation,
          timestamp,
          routes,
        };

        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("x-fpx-trace-id", traceId);
        if (routeInspectorHeader) {
          headers.append("x-Fpx-Route-Inspector", "enabled");
        }

        ctx.waitUntil(
          // Use `originalFetch` to avoid an infinite loop of logging to mizu
          // If we use our monkeyPatched version, then each fetch logs to mizu,
          // which triggers another fetch to log to mizu, etc.
          originalFetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          }),
        );

        const applyArgs = args?.length ? [message, ...args] : [message];

        // To explain the use of this `shouldIgnoreMizuLog` function a bit more:
        //
        // The middleware itself uses `console.log` and `console.error` to send logs to mizu.
        //
        // Specifically, it does this in the monkeypatched version of `fetch`.
        //
        // So, we want to short circuit those logs and not actually print them to the user's console
        // Otherwise, things get realllyyyy noisy.
        //
        if (shouldIgnoreMizuLog(applyArgs)) {
          return;
        }

        if (!libraryDebugMode && shouldPrettifyMizuLog(applyArgs)) {
          // Optionally log a link to the mizu dashboard for the "response" log
          const linkToMizuUi = tryCreateFriendlyLink({
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
