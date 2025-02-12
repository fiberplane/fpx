import type { ApiCallData } from "../../store/slices/types";
import type { ApiRoute } from "../../types";

/**
 * Get the value of the request body, if any. It doesn't support multi-part
 * forms using `File` objects.
 */
export function getBodyValue({
  body,
  method,
}: Pick<ApiCallData, "body"> & Pick<ApiRoute, "method">) {
  // Prevent sending JSON body for GET and HEAD requests, as they're the only
  // methods where providing data is invalid.
  if (method === "GET" || method === "HEAD" || !body.value) {
    return undefined;
  }

  const bodyValue = (() => {
    switch (body.type) {
      case "form-data": {
        const urlEncodedFormData = new URLSearchParams();

        for (const field of body.value) {
          if (field.enabled && field.value.type === "text") {
            urlEncodedFormData.append(field.key, field.value.value);
          }
        }

        return urlEncodedFormData.toString();
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
