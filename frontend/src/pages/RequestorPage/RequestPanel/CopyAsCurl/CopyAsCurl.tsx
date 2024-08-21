import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RequestorState } from "../../reducer";
import { getBodyValue, getContentTypeHeader } from "./utils";

type CopyAsCurlProps = Pick<
  RequestorState,
  "body" | "method" | "path" | "requestHeaders" | "queryParams"
>;

/**
 * Copy the current request as a cURL command to the clipboard.
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
  const isUnsupportedBodyType = body.type === "file";

  const handleCopy = async () => {
    const payload = getBodyValue({ body, method });

    // As we don't support automatic body type switching yet, we now manually
    // set the initial header to Content-Type: application/json if there's a
    // payload. Otherwise, it will be empty.
    const initialHeader = payload ? getContentTypeHeader(body) : "";

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

    const data = payload ? `-d ${payload}` : "";
    const curlCommand = `curl -X ${method} ${url} ${headers} ${data}`;

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
          className={"disabled:pointer-events-auto hover:cursor-pointer"}
          disabled={isUnsupportedBodyType}
        >
          {isCopied ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent>
        {isUnsupportedBodyType ? (
          "Copy as cURL is not supported for file uploads"
        ) : (
          <>{isCopied ? "Copied!" : "Copy as cURL"}</>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
