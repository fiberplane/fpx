import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import { replaceFetch } from "./replace-fetch";
import { RECORDED_CONSOLE_METHODS, log } from "./request-logger";
import {
  errorToJson,
  extractCallerLocation,
  generateUUID,
  polyfillWaitUntil,
  shouldIgnoreFpxLog,
  shouldPrettifyFpxLog,
  specialFormatMessage,
  tryCreateFriendlyLink,
  tryPrettyPrintLoggerLog,
} from "./utils";

// Type hack that makes our middleware types play nicely with Hono types
type RouterRoute = {
  method: string;
  path: string;
  // We can't use the type of a handler that's exported by Hono for some reason.
  // When we do that, our types end up mismatching with the user's app!
  //
  // biome-ignore lint/complexity/noBannedTypes:
  handler: Function;
};

type HonoApp = {
  routes: RouterRoute[];
};

type FpxEnv = {
  FPX_ENDPOINT: string;
  FPX_SERVICE_NAME?: string;
  FPX_LIBRARY_DEBUG_MODE?: string;
};

type FpxConfig = {
  /** Use `libraryDebugMode` to log into the terminal what we are sending to the FPX server on each request/response */
  libraryDebugMode: boolean;
  monitor: {
    /** Send data to FPX about each fetch call made during a handler's lifetime */
    fetch: boolean;
    // TODO - implement this control/feature
    logging: boolean;
    /** Send data to FPX about each incoming request and outgoing response */
    requests: boolean;
  };
};

// TODO - Create helper type for making deeply partial types
type FpxConfigOptions = Partial<
  FpxConfig & {
    monitor: Partial<FpxConfig["monitor"]>;
  }
>;

const defaultConfig = {
  libraryDebugMode: false,
  monitor: {
    fetch: true,
    logging: true,
    requests: true,
  },
};

export function createHonoMiddleware<App extends HonoApp>(
  app?: App,
  config?: FpxConfigOptions,
) {
  const handler = createMiddleware(async function fpxHonoMiddleware(c, next) {
    const {
      libraryDebugMode,
      monitor: {
        fetch: monitorFetch,
        requests: monitorRequests,
        // TODO - implement this control/feature
        // logging: monitorLogging,
      },
    } = mergeConfigs(defaultConfig, config);

    // NOTE - We used to have a handy default for the fpx endpoint, but we need to remove that,
    //        so that people won't accidentally deploy to production with our middleware and
    //        start sending data to the default url.
    const endpoint = env<FpxEnv>(c).FPX_ENDPOINT;
    const isEnabled = !!endpoint;

    if (!isEnabled) {
      // NOTE - In local env, we could print something a little more friendly, about adding FPX_ENDPOINT to .dev.vars
      console.log("FPX_ENDPOINT is not set. Skipping FPX middleware.");
      await next();
      return;
    }

    const service = env<FpxEnv>(c).FPX_SERVICE_NAME || "unknown";

    const ctx = c.executionCtx;

    if (!app) {
      // Logging here before we patch the console.* methods so we don't cause trouble
      console.log(
        "Hono app was not passed to createHonoMiddleware. Skipping automatic route detection.",
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

    // NOTE - Take the traceId from headers but then fall back to uuid here
    const traceId = c.req.header("x-fpx-trace-id") || generateUUID();

    // We monkeypatch `console.*` methods because it's the only way to send consumable logs locally without setting up an otel colletor
    for (const level of RECORDED_CONSOLE_METHODS) {
      const originalConsoleMethod = console[level];
      // HACK - We need to expose a teardown function after requests terminate, so that we can undo our monkey patching
      //        Otherwise, each successive request ends up monkey patching `console.*`, using the previously monkey patched version!!!
      teardownFunctions.push(() => {
        console[level] = originalConsoleMethod;
      });

      // TODO - Fix type of `originalMessage`, since devs could really put anything in there...
      console[level] = (originalMessage: unknown, ...args: unknown[]) => {
        const timestamp = new Date().toISOString();

        const callerLocation = extractCallerLocation(
          (new Error().stack ?? "").split("\n")[2],
        );

        const message = specialFormatMessage(originalMessage);

        const argsToSend = args.map((arg) => {
          if (arg instanceof Error) {
            return errorToJson(arg);
          }

          return arg;
        });

        const routeInspectorHeader = c.req.header("X-Fpx-Route-Inspector");

        const routes = app
          ? app?.routes?.map((route) => ({
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
          args: argsToSend,
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
          // Use `originalFetch` to avoid an infinite loop of logging to FPX
          // If we use our monkeyPatched version, then each fetch logs to FPX,
          // which triggers another fetch to log to FPX, etc.
          originalFetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          }),
        );

        const applyArgs = args?.length ? [message, ...args] : [message];

        // To explain the use of this `shouldIgnoreFpxLog` function a bit more:
        //
        // The middleware itself uses `console.log` and `console.error` to send logs to FPX.
        //
        // Specifically, it does this in the monkeypatched version of `fetch`.
        //
        // So, we want to short circuit those logs and not actually print them to the user's console
        // Otherwise, things get realllyyyy noisy.
        //
        if (shouldIgnoreFpxLog(applyArgs)) {
          return;
        }

        if (!libraryDebugMode && shouldPrettifyFpxLog(applyArgs)) {
          // Optionally log a link to the FPX dashboard for the "response" log
          const linkToFpxUi = tryCreateFriendlyLink({
            message: JSON.stringify(message),
            traceId,
            fpxEndpoint: endpoint,
          });

          // Try parsing the message as json and extracting all the fields we care about logging prettily
          tryPrettyPrintLoggerLog(
            originalConsoleMethod,
            JSON.stringify(message),
            linkToFpxUi,
          );
        } else {
          originalConsoleMethod.apply(originalConsoleMethod, applyArgs);
        }
      };
    }

    if (monitorRequests) {
      c.res.headers.append("x-fpx-trace-id", traceId);
      await log(c, next);
    } else {
      await next();
    }

    for (const teardownFunction of teardownFunctions) {
      teardownFunction();
    }
  });

  return handler;
}

/**
 * Last-in-wins deep merge for FpxConfig
 */
function mergeConfigs(
  fallbackConfig: FpxConfig,
  userConfig?: FpxConfigOptions,
): FpxConfig {
  return {
    libraryDebugMode:
      userConfig?.libraryDebugMode ?? fallbackConfig.libraryDebugMode,
    monitor: Object.assign(fallbackConfig.monitor, userConfig?.monitor),
  };
}
