import { MizuSpan } from "@/queries";

export function getRequestBody(span: MizuSpan) {
  return `${span.attributes["fpx.request.body"]}`;
}

export function getResponseBody(span: MizuSpan) {
  return `${span.attributes["fpx.response.body"]}`;
}

export function getRequestHeaders(span: MizuSpan) {
  return Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => key.startsWith("http.request.header."))
      .map(([key, value]) => [
        key.replace("http.request.header.", ""),
        `${value}`,
      ]),
  );
}

export function getResponseHeaders(span: MizuSpan) {
  return Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => key.startsWith("http.response.header."))
      .map(([key, value]) => [
        key.replace("http.response.header.", ""),
        `${value}`,
      ]),
  );
}

export function getMethod(span: MizuSpan) {
  return `${span.attributes["http.request.method"]}`;
}

export function getStatusCode(span: MizuSpan) {
  return parseInt(`${span.attributes["http.response.status_code"]}`);
}

// NOTE - Meant for SERVER spans
export function getFullUrl(span: MizuSpan) {
  const scheme = span.attributes["url.scheme"];
  const host = span.attributes["server.address"];
  const port = span.attributes["server.port"]
    ? `:${span.attributes["server.port"]}`
    : "";
  const path = span.attributes["url.path"];
  const queryParams = span.attributes["url.query"];
  const queryParamsString = queryParams ? `?${queryParams}` : "";
  return `${scheme}://${host}${port}${path}${queryParamsString}`;
}
