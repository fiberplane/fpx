import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export { renderFullLogMessage } from "./render-log-message";
export { truncateWithEllipsis } from "./truncate";

export function formatDate(d: Date | string) {
  return format(new Date(d), "HH:mm:ss.SSS");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function objectWithKey<T extends string>(
  value: unknown,
  key: T,
): value is { [K in T]: unknown } {
  return typeof value === "object" && value !== null && key in value;
}

export function objectWithKeyAndValue<T extends string, V>(
  value: unknown,
  key: T,
  expectedValue: V,
): value is { [K in T]: V } {
  return objectWithKey(value, key) && value[key] === expectedValue;
}

export function noop() {}

export function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
}

export function parsePathFromRequestUrl(
  url: string,
  queryParams?: Record<string, string>,
) {
  try {
    const fancyUrl = new URL(url);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        fancyUrl.searchParams.set(key, value);
      }
    }
    return `${fancyUrl.pathname}${fancyUrl.search}`;
  } catch {
    return null;
  }
}

export function hasStringMessage(
  object: unknown,
): object is { message: string } {
  return objectWithKey(object, "message") && typeof object.message === "string";
}

/**
 * Utility to see if an unknown type (an error) has a nonempty string property called "message"
 */
export function errorHasMessage(error: unknown): error is { message: string } {
  return hasStringMessage(error) && !!error.message;
}

export function objectHasStack(error: unknown): error is { stack: string } {
  return objectWithKey(error, "stack") && typeof error.stack === "string";
}

export function objectHasName(error: unknown): error is { name: string } {
  return objectWithKey(error, "name") && typeof error.name === "string";
}

export const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export function isModifierKeyPressed(
  event: KeyboardEvent | MouseEvent | React.MouseEvent | React.KeyboardEvent,
) {
  if (isMac) {
    return event.metaKey;
  }
  return event.ctrlKey;
}

export function redactSensitiveHeaders(
  headers?: null | Record<string, string>,
) {
  if (!headers) {
    return headers;
  }

  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "set-cookie",
    "neon-connection-string",
  ];
  const redactedHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      redactedHeaders[key] = "REDACTED";
    } else {
      redactedHeaders[key] = value;
    }
  }

  return redactedHeaders;
}
