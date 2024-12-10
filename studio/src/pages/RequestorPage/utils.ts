import {
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestPath,
  getRequestQueryParams,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
  getStatusCode,
} from "@/utils";
import type { TraceSummary } from "@fiberplane/fpx-types";
import type { ProxiedRequestResponse } from "./queries";

export function sortProxiedRequestResponsesDescending(
  a: ProxiedRequestResponse,
  b: ProxiedRequestResponse,
) {
  try {
    const aLatestTimestamp = a.app_requests?.updatedAt;
    const bLatestTimestamp = b.app_requests?.updatedAt;

    // Handle potential null/undefined values
    if (!aLatestTimestamp) {
      return 1;
    }
    if (!bLatestTimestamp) {
      return -1;
    }

    const aDate = new Date(normalizeTimestamp(aLatestTimestamp));
    const bDate = new Date(normalizeTimestamp(bLatestTimestamp));

    return bDate.getTime() - aDate.getTime();
  } catch (e) {
    console.error("Error sorting ProxiedRequestResponses", e);
    return 0;
  }
}

/**
 * Converts various timestamp formats to ISO 8601
 * Handles both SQLite (YYYY-MM-DD HH:MM:SS.SSS) and ISO 8601 formats
 * Returns original timestamp if format is unknown
 */
const normalizeTimestamp = (timestamp: string): string => {
  // Regular expression to check for ISO 8601 format
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

  // Regular expression to check for SQLite format
  const sqliteRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

  // If it's already ISO 8601, return as is
  if (iso8601Regex.test(timestamp)) {
    return timestamp;
  }

  // If it matches SQLite format, convert it
  if (sqliteRegex.test(timestamp)) {
    return `${timestamp.replace(" ", "T")}Z`;
  }

  // Return original timestamp if format is unknown
  return timestamp;
};

export function traceToProxiedRequestResponse(
  trace: TraceSummary,
): ProxiedRequestResponse | null {
  const { spans, traceId } = trace;
  const rootSpan = spans.find((s) => s.name === "request");
  if (!rootSpan) {
    // This trace doesn't have a request span (yet)
    // This can happen if the trace is still being processed
    return null;
  }

  const id = Math.random();
  const status = getStatusCode(rootSpan);
  const result = {
    app_requests: {
      id,
      updatedAt: rootSpan.end_time.toISOString(),
      requestUrl: getRequestUrl(rootSpan),
      requestMethod: getRequestMethod(rootSpan),
      requestRoute: getRequestPath(rootSpan),
      requestHeaders: getRequestHeaders(rootSpan),
      requestBody: getRequestBody(rootSpan),
      requestPathParams: {},
      getRequestQueryParams: getRequestQueryParams(rootSpan),
    },
    app_responses: {
      id,
      responseStatusCode: status ? status.toString() : "",
      responseBody: getResponseBody(rootSpan) || "",
      responseHeaders: getResponseHeaders(rootSpan),
      traceId,
      isFailure: false,
      failureReason: null,
      updatedAt: rootSpan.end_time.toISOString(),
    },
  };

  return result;
}
