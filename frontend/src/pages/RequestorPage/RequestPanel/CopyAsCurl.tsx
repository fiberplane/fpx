import { Button } from "@/components/ui/button";
import { RequestorState } from "../reducer";

type CopyAsCurlProps = Pick<
  RequestorState,
  "body" | "method" | "path" | "requestHeaders" | "queryParams"
>;

export function CopyAsCurl({
  body,
  method,
  path,
  queryParams,
  requestHeaders,
}: CopyAsCurlProps) {
  const handleClick = async () => {
    // TODO: Validate JSON payload first this is also passing the type
    const parsedBody = JSON.stringify(body);

    const headers = requestHeaders.reduce(
      (acc, { enabled, key, value }) =>
        enabled ? `${acc} -H "${key}: ${value}"` : acc,
      "",
    );

    const url = new URL(path);
    for (const queryParam of queryParams) {
      if (queryParam.enabled) {
        url.searchParams.append(queryParam.key, queryParam.value);
      }
    }

    const curlCommand = `curl -X ${method} ${url} ${headers} -d '${parsedBody}'`;

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
