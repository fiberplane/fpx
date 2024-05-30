import type { NeonDbError } from "@neondatabase/serverless";
import type { MiddlewareHandler, RouterRoute } from "hono/types";
import { getPath } from "hono/utils/url";


// =========================== //
// === Types and constants === //
// =========================== //

type ExtendedExecutionContext = ExecutionContext & {
  __waitUntilTimer?: ReturnType<typeof setInterval>;
  __waitUntilPromises?: Promise<void>[];
  waitUntilFinished?: () => Promise<void>;
};

// HACK - We inject this symbol in our request/response logger in order to skip logging massive payloads
const PRETTIFY_MIZU_LOGGER_LOG = Symbol("PRETTIFY_MIZU_LOGGER_LOG");
const shouldPrettifyMizuLog = (printFnArgs: unknown[]) => printFnArgs?.[1] === PRETTIFY_MIZU_LOGGER_LOG;

const RECORDED_CONSOLE_METHODS = [
  "debug",
  "error",
  "info",
  "log",
  "warn",
] as const;

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
      })

      // TODO - Fix type of `originalMessage`, since devs could really put anything in there...
      console[level] = (originalMessage: string | Error | NeonDbError, ...args: unknown[]) => {
        const timestamp = new Date().toISOString();

        const callerLocation = extractCallerLocation((new Error().stack ?? "").split("\n")[2]);

        let message = originalMessage;
        if (typeof message !== "string" && message.name === "NeonDbError") {
          message = JSON.stringify(neonDbErrorToJson(message as NeonDbError));
        } if (message instanceof Error) {
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

function tryPrettyPrintLoggerLog(fn: PrintFunc, message: string) {
  try {
    const requestOrResponse = JSON.parse(message);
    const lifecycle = requestOrResponse?.lifecycle;
    const method = requestOrResponse?.method;
    const path = requestOrResponse?.path;
    const status = requestOrResponse?.status;
    const elapsed = requestOrResponse?.elapsed;
    const out =
      lifecycle === "request"
        ? `  <-- ${method} ${path}`
        : lifecycle === "response"
          ? `  --> ${method} ${path} ${colorStatus(status)} ${elapsed}`
          : null;

    if (out) {
      fn.apply(fn, [out]);
    }
  } catch (error) {
    // Fail silently
  }
}

/**
 * Using a line from a stack trace, extract information on the location of the caller
 */
function extractCallerLocation(callerLineFromStackTrace?: string) {
  if (!callerLineFromStackTrace) {
    return null;
  }

  const match = callerLineFromStackTrace.match(/at (.*?) \(?(.*?):(\d+):(\d+)\)?$/);
  if (match) {
    const [_, method, file, line, column] = match;
    return {
      method,
      file,
      line,
      column,
    }
  }
  return null;
}

/**
 * Quick and dirty uuid utility
 */
function generateUUID() {
  const timeStamp = new Date().getTime().toString(36);
  const randomPart = () => Math.random().toString(36).substring(2, 15);
  return `${timeStamp}-${randomPart()}-${randomPart()}`;
}


// === LOGGER FUNCTION === //
type PrintFunc = (str: string, ...rest: unknown[]) => void;

function logReq(
  fn: PrintFunc,
  method: string,
  headers: Record<string, string>,
  path: string,
  env: Record<string, string>,
  params: unknown,
  query: Record<string, string>,
  // Originating file of the request handler
  file?: string | null
) {
  const out = {
    lifecycle: "request",
    method,
    headers,
    path,
    env,
    params,
    query,
    file,
  };

  // NOTE - We log a symbol that allows us to hide the log in the terminal UI by default and print something prettier
  fn(JSON.stringify(out), PRETTIFY_MIZU_LOGGER_LOG);
}

function logRes(
  fn: PrintFunc,
  method: string,
  path: string,
  matchedPathPattern?: string,
  matchedPathHandler?: string,
  handlerType?: string,
  status = 0,
  headers?: Record<string, string>,
  body?: string,
  elapsed?: string,
) {
  const out = {
    method,
    lifecycle: "response",
    path,
    route: matchedPathPattern,
    handler: matchedPathHandler,
    handlerType, // Unsure if this is useful... or how
    status: status?.toString(), // HACK - For compatibiltiy with mizu UI
    headers,
    body,
    elapsed,
  };

  fn(JSON.stringify(out), PRETTIFY_MIZU_LOGGER_LOG);
}

export const logger = (
  // HACK - Use print functions that just invoke console.log from outer context
  //        We do this since console.log is monkeypatched in the mizu middleware, so we can't default to just `console.log`
  fn: PrintFunc = (message: string, ...args: unknown[]) => console.log(message, ...args),
  errFn: PrintFunc = (message: string, ...args: unknown[]) => console.error(message, ...args),
): MiddlewareHandler => {
  return async function logger(c, next) {
    // Use a stack trace to get the originating file
    const stack = new Error().stack;
    const file = getFileFromStackTrace(stack ?? "");

    // Get basic request data
    const { method } = c.req;
    const path = getPath(c.req.raw);

    // Copy request headers into plain object
    const reqHeaders: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      reqHeaders[key] = value;
    })

    const requestQueryStringParameters = c.req.query();
    logReq(fn, method, reqHeaders, path, c.env, c.req.param(), requestQueryStringParameters, file);

    const start = Date.now();

    await next();

    const elapsed = time(start);

    const matchedPathPattern = c.req.routePath;
    // HACK - We know we will get a matched route, so coerce the type of `matchedRoute` to RouterRoute
    const matchedRoute: RouterRoute = c.req.matchedRoutes.find((route) => {
      return route.path === c.req.routePath
    }) as RouterRoute;

    const matchedPathHandler = matchedRoute?.handler;

    const handlerType = matchedPathHandler.length < 2 ? 'handler' : 'middleware'

    // Copy headers into a plain object
    const resHeaders: Record<string, string> = {}
    c.res.headers.forEach((value, key) => {
      resHeaders[key] = value;
    })

    // Clone the response so the original isn't affected when we read the body
    const clonedResponse = c.res.clone();
    let body: string;
    try {
      // TODO - Read based off of content-type header
      body = await clonedResponse.text()
    } catch (error) {
      // TODO - Check when this fails
      console.error('Error reading response body:', error);
      body = "__COULD_NOT_PARSE_BODY__";
    }

    // NOTE - Use errFn (console.error) if the status is 4xx or 5xx
    const loggerFn = c.res.status >= 400 ? errFn : fn;

    logRes(loggerFn, method, path, matchedPathPattern, matchedPathHandler?.toString(), handlerType, c.res.status, resHeaders, body, elapsed);
  };
};

const humanize = (times: string[]) => {
  const [delimiter, separator] = [",", "."];

  const orderTimes = times.map((v) =>
    // biome-ignore lint/style/useTemplate: copied from hono source
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter),
  );

  return orderTimes.join(separator);
};

const time = (start: number) => {
  const delta = Date.now() - start;
  return humanize([
    // biome-ignore lint/style/useTemplate: copied from hono source
    delta < 1000 ? delta + "ms" : Math.round(delta / 1000) + "s",
  ]);
};

const colorStatus = (status: number) => {
  const colorEnabled = getColorEnabled();
  const out: { [key: string]: string } = {
    7: colorEnabled ? `\x1b[35m${status}\x1b[0m` : `${status}`,
    5: colorEnabled ? `\x1b[31m${status}\x1b[0m` : `${status}`,
    4: colorEnabled ? `\x1b[33m${status}\x1b[0m` : `${status}`,
    3: colorEnabled ? `\x1b[36m${status}\x1b[0m` : `${status}`,
    2: colorEnabled ? `\x1b[32m${status}\x1b[0m` : `${status}`,
    1: colorEnabled ? `\x1b[32m${status}\x1b[0m` : `${status}`,
    0: colorEnabled ? `\x1b[33m${status}\x1b[0m` : `${status}`,
  };

  const calculateStatus = (status / 100) | 0;

  return out[calculateStatus];
};


function getColorEnabled(): boolean {
  return typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;
}

function getFileFromStackTrace(stack: string) {
  // Regular expression to match the pattern "file://path:line:column"
  const regex = /file:\/\/(\/[\w\-. /]+):(\d+):(\d+)/;

  // Attempt to match the regex pattern against the provided stack trace
  const match = stack.match(regex);

  if (match) {
    // if (stack.includes("neon")) {
    //   debugger
    // }
    // Extract the file path, line, and column from the regex match
    const [, source] = match;
    return source
  }

  // Return null or throw an error if no match is found
  return null;
}

// ================= //
// === Utilities === //
// ================= //



function errorToJson(error: Error) {
  return {
    name: error.name,       // Includes the name of the error, e.g., 'TypeError'
    message: error.message, // The message string of the error
    stack: error.stack      // Stack trace of where the error occurred (useful for debugging)
    // Optionally add more properties here if needed
  };
}

function neonDbErrorToJson(error: NeonDbError) {
  // console.log('hahaaa', error)
  // console.log('SOURCE', error.sourceError)

  // export class NeonDbError extends Error {
  //   name = 'NeonDbError' as const;

  //   severity: string | undefined;
  //   code: string | undefined;
  //   detail: string | undefined;
  //   hint: string | undefined;
  //   position: string | undefined;
  //   internalPosition: string | undefined;
  //   internalQuery: string | undefined;
  //   where: string | undefined;
  //   schema: string | undefined;
  //   table: string | undefined;
  //   column: string | undefined;
  //   dataType: string | undefined;
  //   constraint: string | undefined;
  //   file: string | undefined;
  //   line: string | undefined;
  //   routine: string | undefined;

  //   sourceError: Error | undefined;
  // }

  return {
    name: error.name,
    message: error.message,
    sourceError: error.sourceError ? errorToJson(error.sourceError) : undefined,
    // detail: error.detail,

    // NOTE - NeonDbError does not include a stack trace! https://github.com/neondatabase/serverless/issues/82
    stack: error?.sourceError?.stack,

    // TODO - Figure out how to extract these fields from NeonDbError...
    //
    // where: error?.sourceError?.where,
    // table: error?.sourceError?.table,
    // column: error?.sourceError?.column,
    // dataType: error?.sourceError?.dataType,
    // internalQuery: error?.sourceError?.internalQuery,
  }
}
function polyfillWaitUntil(ctx: ExtendedExecutionContext) {
  if (typeof ctx.waitUntil !== "function") {
    if (!Array.isArray(ctx.__waitUntilPromises)) {
      ctx.__waitUntilPromises = [];
    }

    ctx.waitUntil = function waitUntil(promise: Promise<void>) {
      // biome-ignore lint/style/noNonNullAssertion: https://github.com/highlight/highlight/pull/6480
      ctx.__waitUntilPromises!.push(promise);
      ctx.__waitUntilTimer = setInterval(() => {
        Promise.allSettled(ctx.__waitUntilPromises || []).then(() => {
          if (ctx.__waitUntilTimer) {
            clearInterval(ctx.__waitUntilTimer);
            ctx.__waitUntilTimer = undefined;
          }
        });
      }, 200);
    };
  }

  ctx.waitUntilFinished = async function waitUntilFinished() {
    if (ctx.__waitUntilPromises) {
      await Promise.allSettled(ctx.__waitUntilPromises);
    }
  };
}
