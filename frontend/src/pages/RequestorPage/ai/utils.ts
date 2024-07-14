import { redactSensitiveHeaders } from "@/utils";
import { Requestornator } from "../queries";

/**
 * Simplify a history entry into a string that can be used to represent previous requests/responses.
 *
 * Uses xml-style tags to represent the request and response.
 * The request and response themselves are formatted closely to how a server would render them as text.
 */
export function simplifyHistoryEntry(entry: Requestornator) {
  // NOTE - Can we glean the http version somehow, somewhere?
  return [appRequestToHttpRequest(entry), appResponseToHttpRequest(entry)].join(
    "\n",
  );
}

export function appRequestToHttpRequest(entry: Requestornator) {
  const requestHeaders =
    redactSensitiveHeaders(entry.app_requests.requestHeaders) ?? {};

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
  ].join("\n");
}

export function appResponseToHttpRequest(entry: Requestornator) {
  const responseHeaders =
    redactSensitiveHeaders(entry.app_responses.responseHeaders) ?? {};

  // NOTE - Can we glean the http version somehow, somewhere?
  return [
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
