import { Button } from "@/components/ui/button";
import { RequestorState } from "../reducer";

type CopyAsCurlProps = Pick<
  RequestorState,
  "body" | "method" | "path" | "requestHeaders" | "queryParams"
>;

/**
 * Copy the current request as a curl command to the clipboard. It currently
 * only supports JSON bodies.
 */
export function CopyAsCurl({
  body,
  method,
  path,
  queryParams,
  requestHeaders,
}: CopyAsCurlProps) {
  const handleClick = async () => {
    const payload = jsonBody({ body, method });

    const headers = requestHeaders.reduce(
      (acc, { enabled, key, value }) =>
        enabled ? `${acc} -H "${key}: ${value}"` : acc,
      "",
    );

    const url = new URL(path);
    for (const { enabled, key, value } of queryParams) {
      if (enabled) {
        url.searchParams.append(key, value);
      }
    }

    const curlCommand = `curl -X ${method} ${url} ${headers} ${
      payload ? `-d '${payload}'` : ""
    }`;

    try {
      await navigator.clipboard.writeText(curlCommand);
    } catch (error) {
      console.error("Failed to copy to clipboard: ", error);
    }
  };

  return (
    <Button onClick={handleClick} variant="default" type="button">
      copy as curl
    </Button>
  );
}

/**
 * Prevent sending JSON body for GET and HEAD requests. If the method is valid
 * and the body is JSON, return the JSON stringified body.
 */
function jsonBody({ body, method }: Pick<RequestorState, "body" | "method">) {
  if (method === "GET" || method === "HEAD" || body.type !== "json") {
    return undefined;
  }

  return JSON.stringify(body.value);
}
