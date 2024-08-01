import { useToast } from "@/components/ui/use-toast";
import { useWebsocketQueryInvalidation } from "@/hooks";
import { cn, parsePathFromRequestUrl } from "@/utils";
import { useCallback, useMemo, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { KeyValueParameter, createKeyValueParameters } from "./KeyValueForm";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { useSessionHistory } from "./RequestorSessionHistoryContext";
import { ResponsePanel } from "./ResponsePanel";
import { RoutesCombobox } from "./RoutesCombobox";
import { RoutesPanel } from "./RoutesPanel";
import { useAi } from "./ai";
import {
  MakeProxiedRequestQueryFn,
  type ProbedRoute,
  Requestornator,
  useFetchRequestorRequests,
  useMakeProxiedRequest,
  // useMakeRequest,
} from "./queries";
import { useRequestor } from "./reducer";
import { findMatchedRoute, useRoutes } from "./routes";
import { BACKGROUND_LAYER } from "./styles";
import { RequestMethodInputValue, isRequestMethod, isWsRequest } from "./types";
import { useMakeWebsocketRequest } from "./useMakeWebsocketRequest";
import { RequestorState } from "./reducer/state";

// We need some special CSS for grid layout that tailwind cannot handle
import "./styles.css";

export const RequestorPage = () => {
  const { toast } = useToast();

  // Refresh routes in response to filesystem updates
  useWebsocketQueryInvalidation();

  // TODO - Bring back persisted state once reducer is fully integrated
  // const browserHistoryState = usePersistedUiState();

  // ========================//
  // === Refactored state ===//
  // ========================//
  const refactoredState = useRequestor();
  // @ts-expect-error - testing
  globalThis.refactoredState = refactoredState;
  const {
    // Routes panel
    state: { routes },
    setRoutes,
    selectRoute: handleSelectRoute, // TODO - Rename, just not sure to what
    getActiveRoute,

    // Requestor input
    // - note that `requestType` is an internal property used to determine if we're making a websocket request or not
    state: { path, method, requestType },
    updatePath: handlePathInputChange,
    updateMethod: handleMethodChange,
    getIsInDraftMode,

    // Request panel
    state: { pathParams, queryParams, requestHeaders, body },
    setPathParams,
    updatePathParamValues,
    clearPathParams,
    setQueryParams,
    setRequestHeaders,
    setBody,
    handleRequestBodyTypeChange,

    // Requests Panel tabs
    state: { activeRequestsPanelTab },
    setActiveRequestsPanelTab,
    shouldShowRequestTab,

    // Response Panel tabs
    state: { activeResponsePanelTab },
    setActiveResponsePanelTab,
    shouldShowResponseTab,
  } = refactoredState;

  const selectedRoute = getActiveRoute();

  const { addBaseUrl } = useRoutes({
    setRoutes,
  });

  // NOTE - Use this to test overflow
  // useEffect(() => {
  //   setQueryParams(
  //     createKeyValueParameters(
  //       Array.from({ length: 30 }).map(() => ({ key: "a", value: "" })),
  //     ),
  //   );
  // }, []);

  const {
    history,
    sessionHistory,
    recordRequestInSessionHistory,
    loadHistoricalRequest,
  } = useRequestorHistory({
    routes,
    handleSelectRoute,
    setPath: handlePathInputChange,
    setMethod: handleMethodChange,
    setPathParams,
    setBody,
    setQueryParams,
    setRequestHeaders,
  });

  const mostRecentRequestornatorForRoute = useMostRecentRequestornator(
    { path, method, route: selectedRoute?.path },
    sessionHistory,
  );

  const { mutate: makeRequest, isPending: isRequestorRequesting } =
    useMakeProxiedRequest();

  // WIP - Allows us to connect to a websocket and send messages through it
  const {
    connect: connectWebsocket,
    disconnect: disconnectWebsocket,
    sendMessage: sendWebsocketMessage,
    state: websocketState,
  } = useMakeWebsocketRequest();

  // Send a request when we submit the form
  const onSubmit = useRequestorSubmitHandler({
    body,
    addBaseUrl,
    path,
    method,
    pathParams,
    queryParams,
    requestHeaders,
    makeRequest,
    connectWebsocket,
    recordRequestInSessionHistory,
    selectedRoute,
    requestType,
  });

  const formRef = useRef<HTMLFormElement>(null);

  useHotkeys(
    "mod+enter",
    () => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  const {
    enabled: aiEnabled,
    isLoadingParameters,
    fillInRequest,
    testingPersona,
    setTestingPersona,
    showAiGeneratedInputsBanner,
    setShowAiGeneratedInputsBanner,
    setIgnoreAiInputsBanner,
  } = useAi(selectedRoute, history, {
    setBody,
    setQueryParams,
    setPath: handlePathInputChange,
    setRequestHeaders,
    updatePathParamValues,
  });

  useHotkeys(
    "mod+g",
    (e) => {
      if (aiEnabled) {
        // Prevent the "find in document" from opening in browser
        e.preventDefault();
        if (!isLoadingParameters) {
          toast({
            duration: 3000,
            description: "Generating request parameters with AI",
          });
          fillInRequest();
        }
      }
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  return (
    <div
      className={cn(
        // It's critical the parent has a fixed height for our grid layout to work
        "h-[calc(100vh-64px)]",
        // We want to `grid` all the things
        "grid",
        "gap-2",
        "py-4 px-2",
        "sm:px-4 sm:py-3",
        // Define row templates up until the `lg` breakpoint
        "max-lg:grid-rows-[auto_1fr]",
        // Define column templates for the `lg` breakpoint
        "lg:grid-cols-[auto_1fr]",
        // Adjust spacing at the large breakpoint
        "lg:gap-4",
      )}
    >
      <div
        className={cn(
          "max-h-full",
          "relative",
          "overflow-y-auto",
          "lg:overflow-x-hidden",
        )}
      >
        <div className="lg:hidden">
          <RoutesCombobox
            routes={routes}
            selectedRoute={selectedRoute}
            handleRouteClick={handleSelectRoute}
          />
        </div>
        <RoutesPanel
          routes={routes}
          selectedRoute={selectedRoute}
          handleRouteClick={handleSelectRoute}
        />
      </div>

      <div
        className={cn(
          "grid",
          "fpx-requestor-grid-rows",
          "gap-2",
          // HACK - This is a workaround to prevent the grid from overflowing on smaller screens
          "h-[calc(100%-0.6rem)]",
          "lg:h-full",
          "relative",
          "overflow-scroll",
          "sm:overflow-hidden",
        )}
      >
        <RequestorInput
          addBaseUrl={addBaseUrl}
          requestType={selectedRoute?.requestType}
          method={method}
          handleMethodChange={handleMethodChange}
          path={path}
          handlePathInputChange={handlePathInputChange}
          onSubmit={onSubmit}
          disconnectWebsocket={disconnectWebsocket}
          isRequestorRequesting={isRequestorRequesting}
          formRef={formRef}
          websocketState={websocketState}
          getIsInDraftMode={getIsInDraftMode}
        />

        <div
          className={cn(
            BACKGROUND_LAYER,
            "grid",
            "sm:grid-cols-[auto_1fr]",
            "rounded-md",
            "border",
            // HACK - This prevents overflow from getting too excessive.
            // FIXME - Need to resolve the problem with inner content expanding the parent
            "max-w-screen",
            "max-h-full",
          )}
        >
          <RequestPanel
            activeRequestsPanelTab={activeRequestsPanelTab}
            setActiveRequestsPanelTab={setActiveRequestsPanelTab}
            shouldShowRequestTab={shouldShowRequestTab}
            // HACK - Need to modify this when we support form-data
            body={body}
            setBody={setBody}
            handleRequestBodyTypeChange={handleRequestBodyTypeChange}
            pathParams={pathParams}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setPathParams={setPathParams}
            clearPathParams={clearPathParams}
            setQueryParams={setQueryParams}
            setRequestHeaders={setRequestHeaders}
            aiEnabled={aiEnabled}
            isLoadingParameters={isLoadingParameters}
            fillInRequest={fillInRequest}
            testingPersona={testingPersona}
            setTestingPersona={setTestingPersona}
            showAiGeneratedInputsBanner={showAiGeneratedInputsBanner}
            setShowAiGeneratedInputsBanner={setShowAiGeneratedInputsBanner}
            setIgnoreAiInputsBanner={setIgnoreAiInputsBanner}
            websocketState={websocketState}
            sendWebsocketMessage={sendWebsocketMessage}
          />

          <ResponsePanel
            activeResponsePanelTab={activeResponsePanelTab}
            setActiveResponsePanelTab={setActiveResponsePanelTab}
            shouldShowResponseTab={shouldShowResponseTab}
            response={mostRecentRequestornatorForRoute}
            isLoading={isRequestorRequesting}
            history={history}
            loadHistoricalRequest={loadHistoricalRequest}
            websocketState={websocketState}
            requestType={selectedRoute?.requestType}
          />
        </div>
      </div>
    </div>
  );
};

export default RequestorPage;

type RequestorHistoryHookArgs = {
  routes: ProbedRoute[];
  handleSelectRoute: (r: ProbedRoute, pathParams?: KeyValueParameter[]) => void;
  setPath: (path: string) => void;
  setMethod: (method: RequestMethodInputValue) => void;
  setBody: (body: string | undefined) => void;
  setPathParams: (headers: KeyValueParameter[]) => void;
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
};

function useRequestorHistory({
  routes,
  handleSelectRoute,
  setPath,
  setMethod,
  setRequestHeaders,
  setBody,
  setQueryParams,
}: RequestorHistoryHookArgs) {
  const {
    sessionHistory: sessionHistoryTraceIds,
    recordRequestInSessionHistory,
  } = useSessionHistory();
  const { data: allRequests } = useFetchRequestorRequests();

  // Keep a history of recent requests and responses
  const history = useMemo<Array<Requestornator>>(() => {
    if (allRequests) {
      const cloned = [...allRequests];
      cloned.sort(sortRequestornatorsDescending);
      return cloned;
    }
    return [];
  }, [allRequests]);

  // This feels wrong... but it's a way to load a past request back into the UI
  const loadHistoricalRequest = (traceId: string) => {
    recordRequestInSessionHistory(traceId);
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
        const pathParamsObject = match.app_requests.requestPathParams ?? {};
        const pathParams = createKeyValueParameters(
          Object.entries(pathParamsObject).map(([key, value]) => ({
            key,
            value,
          })),
        );

        // NOTE - Helps us set path parameters correctly
        handleSelectRoute(matchedRoute.route, pathParams);

        // Reset the path to the *exact* path of the request, instead of the route pattern
        const path =
          parsePathFromRequestUrl(match.app_requests.requestUrl) ?? "";
        setPath(path);

        const headers = match.app_requests.requestHeaders ?? {};
        setRequestHeaders(
          createKeyValueParameters(
            Object.entries(headers).map(([key, value]) => ({ key, value })),
          ),
        );

        const queryParams = match.app_requests.requestQueryParams ?? {};
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
        const path =
          parsePathFromRequestUrl(match.app_requests.requestUrl) ?? "";
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

        const queryParams = match.app_requests.requestQueryParams ?? {};
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
  };

  // Keep a local history of requests that the user has made in the UI
  // This should be a subset of the full history
  // These will be cleared on page reload
  const sessionHistory = useMemo(() => {
    return sessionHistoryTraceIds.reduce(
      (matchedRequestornators, traceId) => {
        const match = history.find((r) => r.app_responses?.traceId === traceId);
        if (match) {
          matchedRequestornators.push(match);
        }
        return matchedRequestornators;
      },
      [] as Array<Requestornator>,
    );
  }, [history, sessionHistoryTraceIds]);

  return {
    history,
    sessionHistory,
    recordRequestInSessionHistory,
    loadHistoricalRequest,
  };
}

function useRequestorSubmitHandler({
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
  body: RequestorState["body"];
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
      const modifiedHeaders = [
        contentTypeHeader
          ? {
              key: "Content-Type",
              value: contentTypeHeader,
              enabled: true,
              id: "fpx-content-type",
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

function getContentTypeHeader(body: RequestorState["body"]): string | null {
  switch (body.type) {
    case "json":
      return "application/json";
    case "form-data": {
      const hasFile = body.value.some((item) => item.value.type === "file");
      // NOTE - We want the browser to handle setting this header automatically
      //        Since, it needs to determine the form boundary for multipart/form-data
      if (hasFile) {
        return null;
      }
      return "application/x-www-form-urlencoded";
    }
    default:
      return "text/plain";
  }
}

/**
 * When you select a route from the route side panel,
 * this will look for the most recent request made against that route.
 */
function useMostRecentRequestornator(
  requestInputs: { path: string; method: string; route?: string },
  all: Requestornator[],
) {
  return useMemo<Requestornator | undefined>(() => {
    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestRoute === requestInputs.route &&
        r?.app_requests?.requestMethod === requestInputs.method,
    );

    // Descending sort by updatedAt
    matchingResponses?.sort(sortRequestornatorsDescending);

    return matchingResponses?.[0];
  }, [all, requestInputs]);
}

function sortRequestornatorsDescending(a: Requestornator, b: Requestornator) {
  const aLatestTimestamp = a.app_requests?.updatedAt;
  const bLatestTimestamp = b.app_requests?.updatedAt;
  if (aLatestTimestamp > bLatestTimestamp) {
    return -1;
  }
  if (aLatestTimestamp < bLatestTimestamp) {
    return 1;
  }
  return 0;
}
