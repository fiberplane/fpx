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
import type { Requestornator } from "./queries";

export function sortRequestornatorsDescending(
  a: Requestornator,
  b: Requestornator,
) {
  const aLatestTimestamp = a.app_requests?.updatedAt;
  const bLatestTimestamp = b.app_requests?.updatedAt;
  if (aLatestTimestamp > bLatestTimestamp) {
    return -1;
  }
  if (aLatestTimestamp < bLatestTimestamp) {
    return 1;
  }
  return 0;
}

export function traceToRequestornator(
  trace: TraceSummary,
): Requestornator | null {
  const { spans, traceId } = trace;
  const rootSpan = spans.find((s) => s.name === "request");
  if (!rootSpan) {
    // console.log("spans", spans);
    // throw new Error("Could not find root span for trace");
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
