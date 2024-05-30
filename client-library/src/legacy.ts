import type { NeonDbError } from "@neondatabase/serverless";
import { RECORDED_CONSOLE_METHODS } from "./request-logger";
import {
  PRETTIFY_MIZU_LOGGER_LOG,
  errorToJson,
  extractCallerLocation,
  generateUUID,
  neonDbErrorToJson,
  polyfillWaitUntil,
  shouldPrettifyMizuLog,
  tryPrettyPrintLoggerLog,
} from "./utils";

export { logger } from "./request-logger";

// =========================== //
// === Types and constants === //
// =========================== //

type MizuEnv = {
  MIZU_ENDPOINT: string;
};

// ====================================== //
// === Mizu module with init function === //
// ====================================== //

export const Mizu = {
  init: (
    /** Configuration of Mizu backend */
    { MIZU_ENDPOINT: mizuEndpoint }: MizuEnv,
    ctx: ExecutionContext,
    /** Name of service (not in use, but will be helpful later) */
    service?: string,
    /** Use `libraryDebugMode` to log into the terminal what we are sending to the Mizu server on each request/response */
    libraryDebugMode?: boolean,
  ) => {
    // NOTE - Polyfill is probably not necessary for Cloudflare workers, but could be good for vercel envs
    //         https://github.com/highlight/highlight/pull/6480
    polyfillWaitUntil(ctx);

    const teardownFunctions: Array<() => void> = [];

    // TODO - (future) Take the traceId from headers but then fall back to uuid here?
    const traceId = generateUUID();

    // We monkeypatch `console.*` methods because it's the only way to send consumable logs locally without setting up an otel colletor
    for (const level of RECORDED_CONSOLE_METHODS) {
      const originalConsoleMethod = console[level];
      // HACK - We need to expose a teardown function after requests terminate, so that we can undo our monkeypatching
      //        Otherwise, each successive request ends up monkeypatching `console.*`, using the previously monkeypatched version!!!
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
          fetch(mizuEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }),
        );
        const applyArgs = args?.length ? [message, ...args] : [message];
        if (!libraryDebugMode && shouldPrettifyMizuLog(applyArgs)) {
          // HACK - Try parsing the message as json and extracting all the fields we care about logging prettily
          tryPrettyPrintLoggerLog(originalConsoleMethod, message);
        } else {
          originalConsoleMethod.apply(originalConsoleMethod, applyArgs);
        }
      };
    }

    return () => {
      for (const teardownFunction of teardownFunctions) {
        teardownFunction();
      }
    };
  },
};
