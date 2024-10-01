import { useOtelTraces } from "@/queries";
import { removeQueryParams } from "@/utils";
import type { TraceListResponse } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { useMemo } from "react";
import { createKeyValueParameters } from "./KeyValueForm";
import { type ProxiedRequestResponse, useFetchRequestorRequests } from "./queries";
import { findMatchedRoute } from "./routes";
import { useRequestorStore } from "./store";
import { isRequestMethod, isWsRequest } from "./types";
import { sortProxiedRequestResponsesDescending, traceToProxiedRequestResponse } from "./utils";

const EMPTY_TRACES: TraceListResponse = [];
export function useRequestorHistory() {
  const {
    routes,
    setActiveRoute: handleSelectRoute,
    updatePath: setPath,
    updateMethod: setMethod,
    setRequestHeaders,
    setQueryParams,
    setBody,
    showResponseBodyFromHistory,
  } = useRequestorStore(
    "routes",
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

        // @ts-expect-error - We don't handle ALL methods well yet
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
          createKeyValueParameters(
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
          createKeyValueParameters(
            Object.entries(queryParams).map(([key, value]) => ({
              key,
              value,
            })),
          ),
        );

        // NOTE - We set the body to be undefined or a (json serialized) string for now,
        //        since that helps us render it in the UI (specifically in CodeMirror editors)
        const body = match.app_requests.requestBody;
        if (body === undefined || body === null) {
          setBody(undefined);
        } else {
          const safeBody =
            typeof body !== "string" ? JSON.stringify(body) : body;
          setBody(safeBody);
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
          createKeyValueParameters(
            Object.entries(headers).map(([key, value]) => ({ key, value })),
          ),
        );

        setQueryParams(
          createKeyValueParameters(
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
