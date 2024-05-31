import type { Context } from "hono";
import type { MiddlewareHandler, RouterRoute } from "hono/types";
import { getPath } from "hono/utils/url";

export const RECORDED_CONSOLE_METHODS = [
  "debug",
  "error",
  "info",
  "log",
  "warn",
] as const;

import { PRETTIFY_MIZU_LOGGER_LOG, type PrintFunc } from "./utils";

// === LOGGER FUNCTION === //
function logReq(
  fn: PrintFunc,
  method: string,
  headers: Record<string, string>,
  path: string,
  env: Record<string, string>,
  params: unknown,
  query: Record<string, string>,
  // Originating file of the request handler
  file?: string | null,
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

export async function log(
  c: Context,
  next: () => Promise<void>,
  options?: {
    fn: PrintFunc;
    errFn: PrintFunc;
  },
): Promise<void> {
  const {
    fn = (message: string, ...args: unknown[]) => console.log(message, ...args),
    errFn = (message: string, ...args: unknown[]) =>
      console.error(message, ...args),
  } = options || {};
  // Use a stack trace to get the originating file
  const stack = new Error().stack;
  const file = getFileFromStackTrace(stack ?? "");

  // Get basic request data (method, path)
  const { method } = c.req;
  const path = getPath(c.req.raw);

  // Copy request headers into plain object
  const reqHeaders: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    reqHeaders[key] = value;
  });

  const requestQueryStringParameters = c.req.query();
  logReq(
    fn,
    method,
    reqHeaders,
    path,
    c.env,
    c.req.param(),
    requestQueryStringParameters,
    file,
  );

  const start = Date.now();

  await next();

  const elapsed = time(start);

  const matchedPathPattern = c.req.routePath;
  // HACK - We know we will get a matched route, so coerce the type of `matchedRoute` to RouterRoute
  const matchedRoute: RouterRoute = c.req.matchedRoutes.find((route) => {
    return route.path === c.req.routePath;
  }) as RouterRoute;

  const matchedPathHandler = matchedRoute?.handler;

  const handlerType = matchedPathHandler.length < 2 ? "handler" : "middleware";

  // Copy headers into a plain object
  const resHeaders: Record<string, string> = {};
  c.res.headers.forEach((value, key) => {
    resHeaders[key] = value;
  });

  // Clone the response so the original isn't affected when we read the body
  const clonedResponse = c.res.clone();
  let body: string;
  try {
    // TODO - Read based off of content-type header
    body = await clonedResponse.text();
  } catch (error) {
    // TODO - Check when this fails
    console.error("Error reading response body:", error);
    body = "__COULD_NOT_PARSE_BODY__";
  }

  // NOTE - Use errFn (console.error) if the status is 4xx or 5xx
  const loggerFn = c.res.status >= 400 ? errFn : fn;

  logRes(
    loggerFn,
    method,
    path,
    matchedPathPattern,
    matchedPathHandler?.toString(),
    handlerType,
    c.res.status,
    resHeaders,
    body,
    elapsed,
  );
}

function getFileFromStackTrace(stack: string) {
  // Regular expression to match the pattern "file://path:line:column"
  const regex = /file:\/\/(\/[\w\-. /]+):(\d+):(\d+)/;

  // Attempt to match the regex pattern against the provided stack trace
  const match = stack.match(regex);

  if (match) {
    // Extract the file path from the regex match
    const [, source] = match;
    return source;
  }

  // Return null if no match is found
  return null;
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
