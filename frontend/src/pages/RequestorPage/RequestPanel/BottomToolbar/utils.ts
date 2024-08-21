import type { RequestorState } from "../../reducer";

/**
 * Get the Content-Type header for the request, if any.
 * @
 */
export function getContentTypeHeader(body: RequestorState["body"]) {
  switch (body.type) {
    case "json":
      return "-H 'Content-Type: application/json'";
    case "text":
      return "-H 'Content-Type: text/plain'";
    case "form-data":
      if (body.isMultipart) {
        return "";
      }
      return "-H 'Content-Type: application/x-www-form-urlencoded'";
    default:
      return "";
  }
}

/**
 * Get the value of the request body, if any. It doesn't support multi-part
 * forms using `File` objects.
 */
export function getBodyValue({
  body,
  method,
}: Pick<RequestorState, "body" | "method">) {
  // Prevent sending JSON body for GET and HEAD requests, as they're the only
  // methods where providing data is invalid.
  if (method === "GET" || method === "HEAD" || !body.value) {
    return undefined;
  }

  const bodyValue = (() => {
    switch (body.type) {
      case "form-data": {
        return body.value.reduce((acc, field) => {
          if (!field.enabled || field.value.type !== "text") {
            return acc;
          }

          const encodedKey = encodeURIComponent(field.key);
          const encodedValue = encodeURIComponent(field.value.value);
          const fieldValues = `${encodedKey}=${encodedValue}`;

          const accumulator = acc.length === 0 ? acc : `${acc}&`;
          return accumulator.concat(fieldValues);
        }, "");
      }
      case "json": {
        return body.value.trim();
      }
      case "text":
        return body.value;
    }
  })();

  if (bodyValue) {
    return getStringWithSafeSingleQuotes(bodyValue);
  }
}

export function getStringWithSafeSingleQuotes(value: string) {
  // If the string contains single quotes, we need to use a Heredoc to avoid
  // escaping single quote issues
  if (value.indexOf("'") > 0) {
    return `@- <<EOF\n${value}\nEOF`;
  }

  return `'${value}'`;
}
