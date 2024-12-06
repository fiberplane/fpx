import { useOtelTraces } from "@/queries";
import { createKeyValueParametersFromValues, removeQueryParams } from "@/utils";
import type { TraceListResponse } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { useMemo } from "react";
import {
  type ProxiedRequestResponse,
  useFetchRequestorRequests,
} from "./queries";
import { findMatchedRoute } from "./routes";
import {
  type KeyValueParameter,
  type RequestorBody,
  type RequestorBodyType,
  useStudioStore,
} from "./store";
import { isRequestMethod, isWsRequest } from "./types";
import {
  sortProxiedRequestResponsesDescending,
  traceToProxiedRequestResponse,
} from "./utils";

const EMPTY_TRACES: TraceListResponse = [];

export function useRequestorHistory() {
  const {
    appRoutes: routes,
    setActiveRoute: handleSelectRoute,
    updatePath: setPath,
    updateMethod: setMethod,
    setRequestHeaders,
    setQueryParams,
    setBody,
    showResponseBodyFromHistory,
  } = useStudioStore(
    "appRoutes",
    "setActiveRoute",
    "updatePath",
    "setBody",
    "setQueryParams",
    "updateMethod",
    "setRequestHeaders",
    "showResponseBodyFromHistory",
  );

  const { data: allRequests, isLoading } = useFetchRequestorRequests();
  const { data: traces = EMPTY_TRACES } = useOtelTraces();

  // Keep a history of recent requests and responses
  const history = useMemo<Array<ProxiedRequestResponse>>(() => {
    const items: Array<ProxiedRequestResponse> = [];
    if (allRequests) {
      items.push(...allRequests);
    }

    for (const trace of traces) {
      if (!items.find((r) => r.app_responses?.traceId === trace.traceId)) {
        const convertedTrace = traceToProxiedRequestResponse(trace);
        if (convertedTrace) {
          items.push(convertedTrace);
        }
      }
    }

    items.sort(sortProxiedRequestResponsesDescending);

    return items;
  }, [allRequests, traces]);

  // This feels wrong... but it's a way to load a past request back into the UI
  const loadHistoricalRequest = useHandler((traceId: string) => {
    showResponseBodyFromHistory(traceId);
    const match = history.find((r) => r.app_responses?.traceId === traceId);
    if (match) {
      const method = match.app_requests.requestMethod;
      let routePattern = match.app_requests.requestRoute;
      // HACK - In case it's an unqualified route
      if (routePattern === "") {
        routePattern = "/";
      }
      const requestType = match.app_requests.requestUrl.startsWith("ws")
        ? "websocket"
        : "http";
      const matchedRoute = findMatchedRoute(
        routes,
        routePattern,
        method,
        requestType,
      );

      if (matchedRoute) {
        // const pathParamsObject = match.app_requests.requestPathParams ?? {};
        // const pathParams = createKeyValueParameters(
        //   Object.entries(pathParamsObject).map(([key, value]) => ({
        //     key,
        //     value,
        //   })),
        // );

        // TODO - Handle path params
        // NOTE - Helps us set path parameters correctly
        handleSelectRoute(
          matchedRoute.route,
          // pathParams
        );

        if (matchedRoute.route.method === "ALL") {
          // TODO - Add based off of method of trace...
          if (isRequestMethod(match.app_requests.requestMethod)) {
            setMethod(match.app_requests.requestMethod);
          }
        }

        // Reset the path to the *exact* path of the request, instead of the route pattern
        const queryParams = match.app_requests.requestQueryParams ?? {};
        // NOTE - We remove the query parameters that are explicitly in the `queryParams`
        //        So we do not duplicate them between the path and the form
        const path = removeQueryParams(
          match.app_requests.requestUrl ?? "",
          queryParams,
        );
        setPath(path);

        const headers = match.app_requests.requestHeaders ?? {};
        setRequestHeaders(
          createKeyValueParametersFromValues(
            Object.entries(headers)
              .map(([key, value]) => ({ key, value }))
              .filter(
                // HACK - We don't want to pass through the trace id header,
                //        Otherwise each successive request will be correlated!!
                ({ key }) => key?.toLowerCase() !== "x-fpx-trace-id",
              ),
          ),
        );

        setQueryParams(
          createKeyValueParametersFromValues(
            Object.entries(queryParams).map(([key, value]) => ({
              key,
              value,
            })),
          ),
        );

        // NOTE - We set the body to be undefined or a (json serialized) string for now,
        //        since that helps us render it in the UI (specifically in CodeMirror editors)
        const body = match.app_requests.requestBody;

        // const typeHint = getBodyJsonType(headers);
        if (body === undefined || body === null) {
          setBody(undefined);
        } else {
          const safeBody =
            typeof body !== "string" ? JSON.stringify(body) : body;
          const bodyType = determineBodyType(headers);
          const transformedBody = transformBodyValue(bodyType, safeBody);
          setBody(transformedBody);
        }
      } else {
        // HACK - move this logic into the reducer
        // Reset the path to the *exact* path of the request, instead of the route pattern
        const queryParams = match.app_requests.requestQueryParams ?? {};
        // NOTE - We remove the query parameters that are explicitly in the `queryParams`
        //        So we do not duplicate them between the path and the form
        const path = removeQueryParams(
          match.app_requests.requestUrl ?? "",
          queryParams,
        );
        setPath(path);

        const requestType = match.app_requests.requestUrl.startsWith("ws")
          ? "websocket"
          : "http";

        setMethod(
          isWsRequest(requestType)
            ? "WS"
            : isRequestMethod(method)
              ? method
              : "GET",
        );

        const headers = match.app_requests.requestHeaders ?? {};
        setRequestHeaders(
          createKeyValueParametersFromValues(
            Object.entries(headers).map(([key, value]) => ({ key, value })),
          ),
        );

        setQueryParams(
          createKeyValueParametersFromValues(
            Object.entries(queryParams).map(([key, value]) => ({
              key,
              value,
            })),
          ),
        );
      }
    }
  });

  return {
    history,
    isLoading,
    loadHistoricalRequest,
  };
}

type BodyType = {
  type: RequestorBodyType;
  isMultipart?: boolean;
};

/**
 * Transforms the body value based on the body type into something that can be displayed in the UI
 *
 * @NOTE - This is a temporary solution. Currently does not work for form data.
 */
function transformBodyValue(
  bodyType: BodyType,
  bodyValue: string | undefined | null,
): RequestorBody {
  switch (bodyType.type) {
    case "json": {
      try {
        const parsed = JSON.parse(bodyValue || "");
        return { type: "json", value: JSON.stringify(parsed, null, 2) }; // Pretty-print JSON
      } catch {
        if (!bodyValue) {
          return { type: "json", value: undefined };
        }
        if (typeof bodyValue === "string") {
          return { type: "json", value: bodyValue };
        }
        return { type: "json", value: JSON.stringify(bodyValue) };
      }
    }
    case "text": {
      return { type: "text", value: bodyValue ?? undefined };
    }

    case "form-data": {
      /**
       * NOTE - Handling form bodies is tricky because of how the middleware might serialize them
       * E.g., this is a multipart form data request body as the trace shows it
       *
       * ```
       * {"avatar":{"name":"IMG_5635.png","type":"image/png","size":3141659}}
       * ```
       *
       * E.g., this is a urlencoded form data request body as the trace shows it
       *
       * ```
       * {"name":"Samwise the Brave"}
       * ```
       */
      if (bodyType.isMultipart) {
        // Handle multipart form-data
        // const formattedValue = parseUrlEncodedFormBody(bodyValue ?? "");
        return {
          type: "form-data",
          isMultipart: true,
          value: [],
        };
      }
      // Handle urlencoded form-data
      const formattedValue = parseUrlEncodedFormBody(bodyValue ?? "");
      return {
        type: "form-data",
        isMultipart: false,
        value: formattedValue.map((param) => ({
          ...param,
          value: {
            value: param.value,
            type: "text",
          },
        })),
      };
    }
    case "file":
      return { type: "file", value: undefined };

    default:
      return { type: "text", value: bodyValue ?? undefined };
  }
}

function determineBodyType(headers: Record<string, string>): BodyType {
  const contentType = headers["Content-Type"] || headers["content-type"];
  if (!contentType) {
    return { type: "text" };
  }

  if (contentType.includes("application/json")) {
    return { type: "json" };
  }
  if (
    contentType.includes("application/xml") ||
    contentType.includes("text/xml")
  ) {
    return { type: "text" };
  }
  if (contentType.includes("text/plain")) {
    return { type: "text" };
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return { type: "form-data", isMultipart: false };
  }
  if (contentType.includes("multipart/form-data")) {
    return { type: "form-data", isMultipart: true };
  }
  if (contentType.includes("application/octet-stream")) {
    return { type: "file" };
  }

  return { type: "text" };
}

function parseUrlEncodedFormBody(body: string): KeyValueParameter[] {
  if (isStringifiedRecordWithKeys(body)) {
    return createKeyValueParametersFromValues(
      Object.entries(JSON.parse(body)).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true,
      })),
    );
  }

  // Split the body by '&' to get key-value pairs
  const pairs = body.split("&");

  // Map each pair to a KeyValueParameter
  const keyValueParameters = pairs.map((pair) => {
    const [key, value] = pair.split("=").map(decodeURIComponent);
    return { key, value };
  });

  // Use createKeyValueParameters to generate the final structure
  return createKeyValueParametersFromValues(keyValueParameters);
}

function isStringifiedRecordWithKeys(
  obj: unknown,
): obj is Record<string, string> {
  try {
    const parsed = JSON.parse(obj as string);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}
