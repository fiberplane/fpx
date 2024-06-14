import type { NeonDbError } from "@neondatabase/serverless";
import type { Context, Env, Hono, MiddlewareHandler, Schema } from "hono";
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
import { createMiddleware } from "hono/factory";
import { RouterRoute } from "hono/types";
import { env } from 'hono/adapter'

type FpxEnv = {
  MIZU_ENDPOINT: string;
  SERVICE_NAME?: string;
  FPX_LIBRARY_DEBUG_MODE?: string;
}

type FpxConfig = {
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

type ExtractEnv<T> = T extends Hono<infer E, any, any> ? E : never;
type ExtractBasePath<T> = T extends Hono<any, any, infer P> ? P : never;

const defaultConfig = {
  libraryDebugMode: false,
  monitor: {
    fetch: true,
    logging: true,
    requests: true,
  },
};


export function createHonoMiddleware<E extends Env, S extends Schema, P extends string, App extends Hono<E, S, P>>(
  app?: App,
  config?: FpxConfig,
): MiddlewareHandler<ExtractEnv<App>, ExtractBasePath<App>> {
  // type ThisHonoContext = Parameters<MiddlewareHandler<ExtractEnv<App>, ExtractBasePath<App>>>[0];

  const handler: MiddlewareHandler<ExtractEnv<App>, ExtractBasePath<App>> = async function honoMiddleware(c, next) {
    const {
      libraryDebugMode,
      monitor: {
        fetch: monitorFetch,
        requests: monitorRequests,
        // TODO - implement this control/feature
        // logging: monitorLogging,
      },
    } = { 
      ...defaultConfig,
     ...config,
     monitor: {
      ...defaultConfig.monitor,
       ...config?.monitor,
     }
    };
    // FIXME
    // @ts-ignore
    const endpoint = env<FpxEnv>(c).MIZU_ENDPOINT ?? "http://localhost:8788/v0/logs";
    // @ts-ignore
    const service = env<FpxEnv>(c).SERVICE_NAME || "unknown";

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
          ? app?.routes?.map((route: RouterRoute) => ({
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

  return handler;
}

