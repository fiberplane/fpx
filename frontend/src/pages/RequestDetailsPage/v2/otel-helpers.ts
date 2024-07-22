import { MizuSpan } from "@/queries";

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
