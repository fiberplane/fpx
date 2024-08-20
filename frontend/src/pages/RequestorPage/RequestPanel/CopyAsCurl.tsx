import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [isCopied, setIsCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = async () => {
    const payload = getJsonPayload({ body, method });

    // As we don't support automatic body type switching yet, we now manually
    // set the initial header to Content-Type: application/json if there's a
    // payload. Otherwise, it will be empty.
    const initialHeader = payload ? "-H 'Content-Type: application/json'" : "";

    const headers = requestHeaders.reduce(
      (acc, { enabled, key, value }) =>
        enabled ? `${acc} -H "${key}: ${value}"` : acc,
      initialHeader,
    );

    const url = new URL(path);
    for (const { enabled, key, value } of queryParams) {
      if (enabled) {
        url.searchParams.append(key, value);
      }
    }

    const curlCommand = `curl -X ${method} ${url} ${headers} ${
      payload ? `-d ${payload}` : ""
    }`;

    try {
      await navigator.clipboard.writeText(curlCommand);
      setIsCopied(true);
      timeout.current = setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard: ", error);
    }
  };

  useEffect(() => () => clearTimeout(timeout.current), []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleCopy}
          variant="secondary"
          size="icon"
          type="button"
        >
          {isCopied ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent>{isCopied ? "Copied!" : "Copy as cURL"}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Prevent sending JSON body for GET and HEAD requests, as they're the only
 * methods where providing data is invalid.
 * As we only support JSON right now, we check if the provided body is JSON to
 * then return the JSON stringified body.
 */
function getJsonPayload({
  body,
  method,
}: Pick<RequestorState, "body" | "method">) {
  if (
    method === "GET" ||
    method === "HEAD" ||
    !(body.type === "json" && body.value)
  ) {
    return undefined;
  }

  const trimmedValue = body.value.trim();

  // If the string contains single quotes, we need to use a heredoc to avoid
  // escaping single quote issues
  if (trimmedValue.indexOf("'") > 0) {
    return `@- <<EOF\n${trimmedValue}\nEOF`;
  }

  return `'${trimmedValue}'`;
}
