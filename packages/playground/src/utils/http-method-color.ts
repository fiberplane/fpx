export function getHttpMethodTextColor(method: string) {
  return {
    GET: "text-info",
    POST: "text-success",
    PUT: "text-warning",
    PATCH: "text-warning",
    DELETE: "text-danger",
    OPTIONS: "text-info",
    HEAD: "text-info",
    TRACE: "text-info",
  }[String(method).toUpperCase()];
}
