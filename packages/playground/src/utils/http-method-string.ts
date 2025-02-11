/**
 * Returns a string representation of the HTTP method.
 *
 * In practice, shortens the method name to be 3-5 characters.
 */
export function getHttpMethodString(method: string) {
  return {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DEL",
    OPTIONS: "OPT",
    HEAD: "HEAD",
    TRACE: "TRACE",
  }[String(method).toUpperCase()];
}
