import { useHandler } from "@fiberplane/hooks";
import type { MakeProxiedRequestQueryFn } from "./queries";
import type { KeyValueParameter, RequestorBody } from "./store";
import { useServiceBaseUrl, useStudioStore } from "./store";

export function useRequestorSubmitHandler({
  makeRequest,
}: {
  makeRequest: MakeProxiedRequestQueryFn;
}) {
  const { addServiceUrlIfBarePath } = useServiceBaseUrl();

  const {
    activeRoute,
    body,
    path,
    method,
    pathParams,
    queryParams,
    requestHeaders,
    // requestType,
    // recordRequestInSessionHistory,
  } = useStudioStore(
    "activeRoute",
    "body",
    "path",
    "method",
    "pathParams",
    "queryParams",
    "requestHeaders",
    "requestType",
    "recordRequestInSessionHistory",
  );

  // NOTE - We make the submit handler optional to make it easier to call this as a standalone function
  return useHandler((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    // TODO - Make it clear in the UI that we're auto-adding these headers
    const canHaveBody = !["GET", "DELETE"].includes(method);
    const contentTypeHeader = canHaveBody ? getContentTypeHeader(body) : null;
    const contentLength = canHaveBody ? getContentLength(body) : null;
    const modifiedHeaders = [
      contentTypeHeader
        ? {
            key: "Content-Type",
            value: contentTypeHeader,
            enabled: true,
            id: "fpx-content-type",
          }
        : null,
      contentLength !== null
        ? {
            key: "Content-Length",
            value: contentLength,
            enabled: true,
            id: "fpx-content-length",
          }
        : null,
      ...requestHeaders,
    ].filter(
      (element) => element && element.key.toLowerCase() !== "x-fpx-trace-id",
    ) as KeyValueParameter[];

    makeRequest(
      {
        // HACK - Temporary until this is removed...
        addServiceUrlIfBarePath,
        path,
        method,
        body,
        headers: modifiedHeaders,
        pathParams,
        queryParams,
        route: activeRoute?.path,
      },
      {
        onSuccess(data) {
          console.log("Submit success!", data);
        },
        onError(error) {
          // TODO - Show Toast
          console.error("Submit error!", error);
        },
      },
    );
  });
}

// NOTE - This logic is partly duplicated in `reducer/reducers/content-type.ts`
//        We should refactor to share this logic
function getContentTypeHeader(body: RequestorBody): string | null {
  switch (body.type) {
    case "json":
      return "application/json";
    case "form-data": {
      const shouldDeferToFetchItself =
        body.isMultipart ||
        body.value.some((item) => item.value.type === "file");
      // NOTE - We want the browser to handle setting this header automatically
      //        Since, it needs to determine the form boundary for multipart/form-data
      if (shouldDeferToFetchItself) {
        return null;
      }
      return "application/x-www-form-urlencoded";
    }
    case "file": {
      const file = body.value;
      // TODO - What if file is undefined?
      return file?.type ?? "application/octet-stream";
    }
    default:
      return "text/plain";
  }
}

function getContentLength(body: RequestorBody) {
  switch (body.type) {
    case "file":
      return body.value?.size ?? null;
    default:
      return null;
  }
}
