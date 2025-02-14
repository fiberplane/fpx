import { createParameterId } from "@/pages/RequestorPage/KeyValueForm/data";
import type {
  KeyValueParameter,
  RequestorBody,
} from "@/pages/RequestorPage/store";
import { RequestorBodySchema } from "@/pages/RequestorPage/store/request-body";
import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { type PathParam, generatePath } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export * from "./screen-size";
export * from "./vendorify-traces";
export * from "./otel-helpers";
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

export const safeParseJson = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
};

export function getHttpMethodTextColor(method: string) {
  return {
    GET: "text-blue-500",
    POST: "text-yellow-500",
    PUT: "text-orange-500",
    PATCH: "text-orange-500",
    DELETE: "text-red-500",
    OPTIONS: "text-blue-300",
    HEAD: "text-gray-400",
    WS: "text-green-500",
  }[String(method).toUpperCase()];
}

export function isSensitiveEnvVar(key: string) {
  if (!key) {
    return false;
  }

  return (
    key.includes("APIKEY") ||
    key.includes("API_KEY") ||
    key.includes("ACCESS") ||
    key.includes("AUTH_") ||
    key.includes("CREDENTIALS") ||
    key.includes("CERTIFICATE") ||
    key.includes("PASSPHRASE") ||
    key.includes("DATABASE_URL") ||
    key.includes("CONNECTION_STRING") ||
    key.includes("SECRET") ||
    key.includes("PASSWORD") ||
    key.includes("PRIVATE") ||
    key.includes("TOKEN")
  );
}

export function constructRequestorBody(bodyValue: string): RequestorBody {
  try {
    const parsed = JSON.parse(bodyValue);
    const result = RequestorBodySchema.safeParse(parsed);
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

export function generatePathWithSearchParams<Path extends string>(
  originalPath: Path,
  params: {
    [key in PathParam<Path>]: string | null;
  },
  searchParams: URLSearchParams,
): string {
  const searchString = searchParams.toString();
  const generatedPath = generatePath(originalPath, params);
  if (!searchString) {
    return generatedPath;
  }

  return `${generatedPath}${generatedPath.includes("?") ? "&" : "?"}${searchString}`;
}
