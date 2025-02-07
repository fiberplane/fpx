import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStudioStore } from "../../store/hooks";
import { useApiCallData } from "../../store/hooks/useApiCallData";
import { useUrlPreview } from "../../store/hooks/useUrlPreview";
import { getBodyValue } from "./utils";

/**
 * Copy the current request as a cURL command to the clipboard.
 */
export function CopyAsCurl() {
  const [isCopied, setIsCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const { body, requestHeaders } = useApiCallData(
    "body",
    // "pathParams",
    // "queryParams",
    "requestHeaders",
    // "authorizationId",
  );
  const { activeRoute } = useStudioStore("activeRoute");

  const method = activeRoute?.method ?? "GET";

  const url = useUrlPreview();
  const isUnsupportedBodyType =
    body.type === "file" || (body.type === "form-data" && body.isMultipart);

  const handleCopy = async () => {
    if (!activeRoute) {
      return;
    }

    const payload = getBodyValue({
      body,
      method: activeRoute.method,
    });

    const headers = requestHeaders.reduce((acc, { enabled, key, value }) => {
      if (!enabled) {
        return acc;
      }

      return `${acc} -H "${key}: ${value}"`;
    }, "");

    // const url = new URL(path);
    // for (const { enabled, key, value } of queryParams) {
    //   if (enabled) {
    //     url.searchParams.append(key, value);
    //   }
    // }

    const data = payload ? `-d ${payload}` : "";
    const curlCommand = `curl -X ${method} '${url}' ${headers} ${data}`;

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
          className="disabled:pointer-events-auto h-auto"
          disabled={isUnsupportedBodyType}
        >
          {isCopied ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <CopyIcon className="w-3 h-3" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent align="end">
        {isUnsupportedBodyType ? (
          "Copy as cURL is not supported for file uploads"
        ) : (
          <>{isCopied ? "Copied!" : "Copy as cURL"}</>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
