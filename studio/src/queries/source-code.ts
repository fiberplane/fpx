import { useApiBaseUrl } from "@/hooks";
import { objectWithKey } from "@/utils";
import { useEffect, useState } from "react";

export function useHandlerSourceCode(source?: string, handler?: string) {
  const apiBaseUrl = useApiBaseUrl();

  const [handlerSourceCode, setHandlerSourceCode] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!source) {
      return;
    }
    if (!handler) {
      return;
    }

    fetchSourceLocation(apiBaseUrl, source, handler).then((sourceCode) => {
      if (typeof sourceCode === "string" && sourceCode) {
        setHandlerSourceCode(sourceCode);
      }
    });
  }, [apiBaseUrl, handler, source]);

  return handlerSourceCode;
}

export async function fetchSourceLocation(
  apiBaseUrl: string,
  source: string | undefined,
  handler: string | undefined,
) {
  if (!source) {
    return null;
  }
  if (!handler) {
    return null;
  }
  const query = new URLSearchParams({
    source,
    handler,
  });
  try {
    const response = await fetch(
      `${apiBaseUrl}/v0/source-function?${query.toString()}`,
      {
        method: "POST",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch source location from source map: ${response.status}`,
      );
    }
    const responseBody = await response.json();
    if (
      objectWithKey(responseBody, "functionText") &&
      typeof responseBody.functionText === "string"
    ) {
      return responseBody.functionText;
    }

    console.warn(
      "Response of source-function had unexpeted format. (Expected object with key 'functionText')",
      responseBody,
    );
    return null;
  } catch (err) {
    console.debug("Could not fetch source location from source map", err);
    return null;
  }
}
