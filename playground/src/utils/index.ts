import { createParameterId } from "@/components/playground/KeyValueForm/data";
import type {
  KeyValueParameter,
  PlaygroundBody,
} from "@/components/playground/store";
import { PlaygroundBodySchema } from "@/components/playground/store";
import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export * from "./screen-size";
export * from "./otel-helpers";
export * from "./vendorify-traces";
export { isSensitiveEnvVar } from "./env-vars";
export { renderFullLogMessage } from "./render-log-message";
export { truncateWithEllipsis } from "./truncate";
export { parseEmbeddedConfig } from "./config-parser";
export { safeParseJson } from "./safe-parse-json";
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
  { preserveHost = false } = {},
) {
  try {
    const fancyUrl = new URL(url);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        fancyUrl.searchParams.set(key, value);
      }
    }
    if (preserveHost) {
      return fancyUrl.toString();
    }
    return `${fancyUrl.pathname}${fancyUrl.search}`;
  } catch {
    return null;
  }
}

/**
 * Removes specified query parameters from a URL
 */
export function removeQueryParams(
  url: string,
  queryParams: Record<string, string>,
) {
  if (!url) {
    return url;
  }
  try {
    const newUrl = new URL(url);
    for (const [key] of Object.entries(queryParams)) {
      newUrl.searchParams.delete(key);
    }
    return newUrl.toString();
  } catch {
    return url;
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

export const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "neon-connection-string",
];

export function redactSensitiveHeaders(
  headers?: null | Record<string, string>,
) {
  if (!headers) {
    return headers;
  }

  const redactedHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      redactedHeaders[key] = "REDACTED";
    } else {
      redactedHeaders[key] = value;
    }
  }

  return redactedHeaders;
}

export function truncatePathWithEllipsis(path: string | null) {
  if (path === null) {
    return null;
  }

  const maxLength = 50;
  return path.length > maxLength ? `${path.slice(0, maxLength)}...` : path;
}

export function safeParseUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.host,
      scheme: parsedUrl.protocol.replace(":", ""),
    };
  } catch (error) {
    console.error("[safeParseUrl] Invalid URL:", url, error);
    return {
      host: "",
      scheme: "",
    };
  }
}

export const safeToQueryComponent = (
  queryParams: Record<string, string> | null | undefined,
) => {
  if (!queryParams) {
    return "";
  }
  try {
    return new URLSearchParams(queryParams).toString();
  } catch (error) {
    console.error("Invalid query params:", queryParams, error);
    return "";
  }
};

export function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function getHttpMethodTextColor(method: string) {
  return {
    GET: "text-info",
    POST: "text-success",
    PUT: "text-warning",
    PATCH: "text-warning",
    DELETE: "text-danger",
    OPTIONS: "text-info",
    HEAD: "text-info",
    WS: "text-success",
  }[String(method).toUpperCase()];
}

export function constructPlaygroundBody(bodyValue: string): PlaygroundBody {
  try {
    const parsed = JSON.parse(bodyValue);
    const result = PlaygroundBodySchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // swallow error
  }

  return {
    type: "text",
    value: bodyValue,
  };
}

export function createKeyValueParametersFromValues(
  values: Array<{ key: string; value: string }>,
) {
  return values.map(({ key, value }) => {
    return {
      id: createParameterId(),
      key,
      value,
      enabled: true,
    };
  });
}

export function createObjectFromKeyValueParameters<
  T extends Array<KeyValueParameter>,
>(parameters: T): Record<T[0]["key"], T[0]["value"]> {
  const result: Record<string, string> = {};
  for (const item of parameters) {
    if (item.key && item.enabled) {
      result[item.key] = item.value;
    }
  }

  return result;
}
