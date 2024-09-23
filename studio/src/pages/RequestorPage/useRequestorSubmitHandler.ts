import { useToast } from "@/components/ui/use-toast";
import { useHandler } from "@fiberplane/hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { KeyValueParameter } from "./KeyValueForm";
import type { MakeProxiedRequestQueryFn } from "./queries";
import type { RequestorBody } from "./store";
import { useRequestorStore } from "./store";
import { useServiceBaseUrl } from "./store/useServiceBaseUrl";
import { isWsRequest } from "./types";

export function useRequestorSubmitHandler({
  makeRequest,
  connectWebsocket,
  recordRequestInSessionHistory,
  generateLinkToTrace,
}: {
  makeRequest: MakeProxiedRequestQueryFn;
  connectWebsocket: (wsUrl: string) => void;
  recordRequestInSessionHistory: (traceId: string) => void;
  generateLinkToTrace: (traceId: string) => string;
}) {
  const { toast } = useToast();

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    activeRoute,
    body,
    path,
    method,
    pathParams,
    queryParams,
    requestHeaders,
    requestType,
  } = useRequestorStore(
    "activeRoute",
    "body",
    "path",
    "method",
    "pathParams",
    "queryParams",
    "requestHeaders",
    "requestType",
  );

  const { addServiceUrlIfBarePath } = useServiceBaseUrl();
  const { activeHistoryResponseTraceId } = useRequestorStore();
  return useHandler((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO - Make it clear in the UI that we're auto-adding this header
    const canHaveBody =
      !isWsRequest(requestType) && !["GET", "DELETE"].includes(method);
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
      (element) =>
        element &&
        element.key.toLowerCase() !== "x-fpx-trace-id" &&
        element.value !== activeHistoryResponseTraceId,
    ) as KeyValueParameter[];

    if (isWsRequest(requestType)) {
      const url = addServiceUrlIfBarePath(path);
      connectWebsocket(url);
      toast({
        description: "Connecting to websocket",
      });
      return;
    }

    makeRequest(
      {
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
          const traceId = data?.traceId;

          if (traceId && typeof traceId === "string") {
            navigate(
              {
                pathname: generateLinkToTrace(traceId),
                search: params.toString(),
              },
              { replace: true },
            );
            recordRequestInSessionHistory(traceId);
          } else {
            console.error(
              "RequestorPage: onSuccess: traceId is not a string",
              data,
            );
          }
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
