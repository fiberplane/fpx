import { cn, isJson, parsePathFromRequestUrl } from "@/utils";
import { useCallback, useMemo, useRef } from "react";
import { KeyValueParameter, createKeyValueParameters } from "./KeyValueForm";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { useSessionHistory } from "./RequestorSessionHistoryContext";
import { ResponsePanel } from "./ResponsePanel";
import { RoutesCombobox } from "./RoutesCombobox";
import { RoutesPanel } from "./RoutesPanel";
import { useAi } from "./ai";
import { useRequestorFormData } from "./data";
import { usePersistedUiState, useSaveUiState } from "./persistUiState";
import {
  type ProbedRoute,
  Requestornator,
  useFetchRequestorRequests,
  useMakeRequest,
} from "./queries";
import { findMatchedRoute, useReselectRouteHack, useRoutes } from "./routes";
// We need some special CSS for grid layout that tailwind cannot handle
import "./RequestorPage.css";
import { useToast } from "@/components/ui/use-toast";
import { useWebsocketQueryInvalidation } from "@/hooks";
import { useHotkeys } from "react-hotkeys-hook";
import { BACKGROUND_LAYER } from "./styles";
import { useMakeWebsocketRequest } from "./useMakeWebsocketRequest";

export const RequestorPage = () => {
  // Refresh routes in response to filesystem updates
  useWebsocketQueryInvalidation();

  const { toast } = useToast();
  const browserHistoryState = usePersistedUiState();

  const {
    routes,
    setDraftRoute,
    deleteDraftRoute,
    addBaseUrl,
    selectedRoute,
    setSelectedRoute,
  } = useRoutes(browserHistoryState);

  const {
    path,
    setPath,
    handlePathInputChange,
    method,
    handleMethodChange,
    body,
    setBody,
    pathParams,
    setPathParams,
    requestHeaders,
    setRequestHeaders,
    queryParams,
    setQueryParams,
    handleSelectRoute,
  } = useRequestorFormData(
    routes,
    selectedRoute,
    setSelectedRoute,
    setDraftRoute,
    browserHistoryState,
  );

  useReselectRouteHack({
    selectedRoute,
    setSelectedRoute,
    routes,
    path,
    method,
    setPathParams,
  });

  // When we unmount, save the current state of UI to the browser history
  // This allows us to reload the page when you press "Back" in the browser
  useSaveUiState({
    route: selectedRoute,
    path,
    method,
    body,
    pathParams,
    queryParams,
    requestHeaders,
  });

  const {
    history,
    sessionHistory,
    recordRequestInSessionHistory,
    loadHistoricalRequest,
  } = useRequestorHistory({
    routes,
    handleSelectRoute,
    setPath,
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
    useMakeRequest();

  // TODO - Allows us to connect to a websocket and send messages through it
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
    setPath,
    setPathParams,
    setRequestHeaders,
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
          deleteDraftRoute={deleteDraftRoute}
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
          isWs={selectedRoute?.isWs}
          method={method}
          handleMethodChange={handleMethodChange}
          path={path}
          handlePathInputChange={handlePathInputChange}
          onSubmit={onSubmit}
          disconnectWebsocket={disconnectWebsocket}
          isRequestorRequesting={isRequestorRequesting}
          formRef={formRef}
          websocketState={websocketState}
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
            method={method}
            body={body}
            setBody={setBody}
            pathParams={pathParams}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setPath={setPath}
            currentRoute={selectedRoute?.path}
            setPathParams={setPathParams}
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
            response={mostRecentRequestornatorForRoute}
            isLoading={isRequestorRequesting}
            history={history}
            loadHistoricalRequest={loadHistoricalRequest}
            websocketState={websocketState}
            isWs={selectedRoute?.isWs ?? false}
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
  setBody: (body?: string) => void;
  setPathParams: (headers: KeyValueParameter[]) => void;
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
};

function useRequestorHistory({
  routes,
  handleSelectRoute,
  setPath,
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
      const routePattern = match.app_requests.requestRoute;
      const matchedRoute = findMatchedRoute(routes, routePattern, method);

      if (matchedRoute) {
        const pathParamsObject = match.app_requests.requestPathParams ?? {};
        const pathParams = createKeyValueParameters(
          Object.entries(pathParamsObject).map(([key, value]) => ({
            key,
            value,
          })),
        );

        // NOTE - Helps us set path parameters correctly
        handleSelectRoute(matchedRoute, pathParams);

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
  addBaseUrl: (path: string, options?: { isWs?: boolean }) => string;
  selectedRoute: ProbedRoute | null;
  body: string | undefined;
  path: string;
  method: string;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  requestHeaders: KeyValueParameter[];
  makeRequest: ReturnType<typeof useMakeRequest>["mutate"];
  connectWebsocket: (wsUrl: string) => void;
  recordRequestInSessionHistory: (traceId: string) => void;
}) {
  const { toast } = useToast();
  return useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // FIXME - This blocks user from making requests when no routes have been detected
      if (!selectedRoute) {
        return;
      }

      if (selectedRoute.isWs) {
        const url = addBaseUrl(selectedRoute.path, { isWs: true });
        connectWebsocket(url);
        toast({
          description: "Connecting to websocket",
        });
        return;
      }

      // FIXME - We need to consider if the user is trying to actually send a JSON body
      //         For now we just assume it's always JSON
      //         This code will break if, for example, the user passes the string "null" as the body...
      //         in that case, the body will be converted to null, which is not what they want.
      const hackyBody =
        typeof body === "string" && isJson(body) ? JSON.parse(body) : body;

      makeRequest(
        {
          addBaseUrl,
          path,
          method,
          body: hackyBody,
          headers: requestHeaders,
          pathParams,
          queryParams,
          route: selectedRoute.path,
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
      body,
      makeRequest,
      method,
      path,
      pathParams,
      queryParams,
      recordRequestInSessionHistory,
      requestHeaders,
      selectedRoute,
      addBaseUrl,
      connectWebsocket,
      toast,
    ],
  );
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
