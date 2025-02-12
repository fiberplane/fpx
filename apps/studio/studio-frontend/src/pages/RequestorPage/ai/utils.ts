import { isJson, redactSensitiveHeaders } from "@/utils";
import type { ProxiedRequestResponse } from "../queries";
import { trimJsonBody } from "./trim-json-body";

/**
 * Simplify a history entry into a string that can be used to represent previous requests/responses.
 *
 * Uses xml-style tags to represent the request and response.
 * Truncates the request and response bodies to minimize token count.
 * The request and response themselves are formatted closely to how a server would render them as text.
 */
export function simplifyHistoryEntry(entry: ProxiedRequestResponse) {
  // NOTE - Can we glean the http version somehow, somewhere?
  return [appRequestToHttpRequest(entry), appResponseToHttpRequest(entry)].join(
    "\n",
  );
}

export function appRequestToHttpRequest(entry: ProxiedRequestResponse) {
  const requestHeaders =
    redactSensitiveHeaders(entry.app_requests.requestHeaders) ?? {};

  const queryParams = new URLSearchParams(
    entry.app_requests.requestQueryParams || {},
  ).toString();
  const requestUrl = entry.app_requests.requestUrl;
  const requestUrlWithParams = queryParams
    ? `${requestUrl}?${queryParams}`
    : requestUrl;

  // HACK - Should we only do this for certain JSON content type? Or text?
  const requestBody = transformBody(entry.app_requests.requestBody);
  // NOTE - Can we glean the http version somehow, somewhere?
  return [
    "<request>",
    `HTTP/1.1 ${entry.app_requests.requestMethod} ${requestUrlWithParams}`,
    ...transformHeaders(requestHeaders),
    "",
    `${requestBody || ""}`,
    "</request>",
  ].join("\n");
}

export function appResponseToHttpRequest(entry: ProxiedRequestResponse) {
  const responseHeaders =
    redactSensitiveHeaders(entry.app_responses?.responseHeaders) ?? {};

  const responseBody = transformBody(entry.app_responses?.responseBody);
  // NOTE - Can we glean the http version somehow, somewhere?
  return [
    "<response>",
    // TODO - Append response statusText to the string below!!! (we don't have that info right now)
    `HTTP/1.1 ${entry.app_responses?.responseStatusCode}`,
    ...transformHeaders(responseHeaders),
    "",
    `${responseBody || ""}`,
    "</response>",
  ].join("\n");
}

function transformHeaders(headers: Record<string, string>) {
  return Object.entries(headers).map(([key, value]) => `${key}: ${value}`);
}

function transformBody(body: unknown) {
  // HACK - If the body was saved as a string, and it's JSON, then we need to parse it, trim it, then re-stringify it
  if (typeof body === "string" && isJson(body)) {
    return JSON.stringify(trimJsonBody(JSON.parse(body)));
  }
  if (typeof body === "object" && body !== null) {
    return JSON.stringify(trimJsonBody(body));
  }
  return body;
}
