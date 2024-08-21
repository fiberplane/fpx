import type { RequestorState } from "../../reducer";

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
 * Prevent sending JSON body for GET and HEAD requests, as they're the only
 * methods where providing data is invalid.
 */
export function getBodyValue({
  body,
  method,
}: Pick<RequestorState, "body" | "method">) {
  // Prevent sending JSON body for GET and HEAD requests, as they're the only
  // methods where providing data is invalid.
  if (method === "GET" || method === "HEAD") {
    return undefined;
  }

  if (body.type === "file" || !body.value) {
    return undefined;
  }

  if (body.type === "form-data") {
    const formData = body.value.reduce((acc, field) => {
      const isValidField = field.enabled && field.value.type === "text";

      if (isValidField) {
        const accumulator = acc.length === 0 ? acc : `${acc}&`;
        return `${accumulator}${field.key}=${field.value.value}`;
      }

      return acc;
    }, "");

    return getStringWithSafeSingleQuotes(formData);
  }

  // Trim the JSON body value to avoid sending unnecessary whitespace
  const value = body.type === "json" ? body.value.trim() : body.value;
  const bodyValue = getStringWithSafeSingleQuotes(value);

  return bodyValue;
}

export function getStringWithSafeSingleQuotes(value: string) {
  // If the string contains single quotes, we need to use a heredoc to avoid
  // escaping single quote issues
  if (value.indexOf("'") > 0) {
    return `@- <<EOF\n${value}\nEOF`;
  }

  return `'${value}'`;
}
