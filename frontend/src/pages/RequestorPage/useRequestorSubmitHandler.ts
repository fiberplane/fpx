import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";
import { KeyValueParameter } from "./KeyValueForm";
import { MakeProxiedRequestQueryFn, ProbedRoute } from "./queries";
import { RequestorBody, RequestorState } from "./reducer";
import { useRoutes } from "./routes";
import { isWsRequest } from "./types";

export function useRequestorSubmitHandler({
  requestType,
  selectedRoute,
  body,
  path,
  addBaseUrl,
  method,
  pathParams,
  queryParams,
  requestHeaders,
  makeRequest,
  connectWebsocket,
  recordRequestInSessionHistory,
}: {
  addBaseUrl: ReturnType<typeof useRoutes>["addBaseUrl"];
  selectedRoute: ProbedRoute | null;
  body: RequestorBody;
  path: string;
  method: string;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  requestHeaders: KeyValueParameter[];
  makeRequest: MakeProxiedRequestQueryFn;
  connectWebsocket: (wsUrl: string) => void;
  recordRequestInSessionHistory: (traceId: string) => void;
  requestType: RequestorState["requestType"];
}) {
  const { toast } = useToast();
  return useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (isWsRequest(requestType)) {
        const url = addBaseUrl(path, {
          requestType,
        });
        connectWebsocket(url);
        toast({
          description: "Connecting to websocket",
        });
        return;
      }

      // TODO - Make it clear in the UI that we're auto-adding this header
      const contentTypeHeader = getContentTypeHeader(body);
      const contentLength = getContentLength(body);
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
      ].filter(Boolean) as KeyValueParameter[];

      // TODO - Check me
      if (isWsRequest(requestType)) {
        const url = addBaseUrl(path, {
          requestType: requestType,
        });
        connectWebsocket(url);
        toast({
          description: "Connecting to websocket",
        });
        return;
      }

      makeRequest(
        {
          addBaseUrl,
          path,
          method,
          body,
          headers: modifiedHeaders,
          pathParams,
          queryParams,
          route: selectedRoute?.path,
        },
        {
          onSuccess(data) {
            const traceId = data?.traceId;
            if (traceId && typeof traceId === "string") {
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
    },
    [
      requestType,
      body,
      requestHeaders,
      makeRequest,
      addBaseUrl,
      path,
      method,
      pathParams,
      queryParams,
      connectWebsocket,
      toast,
      recordRequestInSessionHistory,
      selectedRoute,
    ],
  );
}

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
    case "file":
      return "application/octet-stream";
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
