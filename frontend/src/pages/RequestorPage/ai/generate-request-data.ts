import { useQuery } from "react-query";
import { ProbedRoute, Requestornator } from "../queries";

const fetchAiRequestData = (
  route: ProbedRoute | null,
  history: Array<Requestornator>,
  persona: string,
) => {
  // FIXME - type wonkiness
  const { handler, method, path } = route ?? {};
  const simplifiedHistory = history.map(simplifyHistoryEntry);
  return fetch("/v0/generate-request", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      handler,
      method,
      path,
      history: simplifiedHistory,
      persona,
    }),
  }).then(async (r) => {
    if (!r.ok) {
      const payload = await r.json().catch(() => null);
      throw new Error(payload?.message || "Failed to generate request data");
    }
    return r.json();
  });
};

/**
 * Simplify a history entry into a string that can be used to represent previous requests/responses.
 *
 * Uses xml-style tags to represent the request and response.
 * The request and response themselves are formatted closely to how a server would render them as text.
 */
function simplifyHistoryEntry(entry: Requestornator) {
  const requestHeaders =
    redactSensitiveHeaders(entry.app_requests.requestHeaders) ?? {};
  const responseHeaders =
    redactSensitiveHeaders(entry.app_responses.responseHeaders) ?? {};

  const queryParams = new URLSearchParams(
    entry.app_requests.requestQueryParams || {},
  ).toString();
  const requestUrl = entry.app_requests.requestUrl;
  const requestUrlWithParams = queryParams
    ? `${requestUrl}?${queryParams}`
    : requestUrl;

  // NOTE - Can we glean the http version somehow, somewhere?
  return [
    "<request>",
    `HTTP/1.1 ${entry.app_requests.requestMethod} ${requestUrlWithParams}`,
    ...Object.entries(requestHeaders).map(([key, value]) => `${key}: ${value}`),
    ``,
    `${entry.app_requests.requestBody || ""}`,
    "</request>",
    "<response>",
    // TODO - Append response statusText to the string below!!! (we don't have that info right now)
    `HTTP/1.1 ${entry.app_responses.responseStatusCode}`,
    ...Object.entries(responseHeaders).map(
      ([key, value]) => `${key}: ${value}`,
    ),
    ``,
    `${entry.app_responses.responseBody || ""}`,
    "</response>",
  ].join("\n");
}

export function useAiRequestData(
  route: ProbedRoute | null,
  history: Array<Requestornator>,
  persona = "Friendly",
) {
  return useQuery({
    queryKey: ["generateRequest"],
    queryFn: () => fetchAiRequestData(route, history, persona),
    enabled: false,
    retry: false,
  });
}

export function redactSensitiveHeaders(
  headers?: null | Record<string, string>,
) {
  if (!headers) {
    return headers;
  }

  const sensitiveHeaders = ["authorization", "cookie", "set-cookie"];
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
