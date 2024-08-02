import { useToast } from "@/components/ui/use-toast";
import { useWebsocketQueryInvalidation } from "@/hooks";
import { cn } from "@/utils";
import { useCallback, useMemo, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { KeyValueParameter } from "./KeyValueForm";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { ResponsePanel } from "./ResponsePanel";
import { RoutesCombobox } from "./RoutesCombobox";
import { RoutesPanel } from "./RoutesPanel";
import { useAi } from "./ai";
import {
  MakeProxiedRequestQueryFn,
  type ProbedRoute,
  Requestornator,
  useMakeProxiedRequest,
} from "./queries";
import {
  type RequestorBody,
  type RequestorState,
  useRequestor,
} from "./reducer";
import { useRoutes } from "./routes";
import { BACKGROUND_LAYER } from "./styles";
import { isWsRequest } from "./types";
import { useMakeWebsocketRequest } from "./useMakeWebsocketRequest";

// We need some special CSS for grid layout that tailwind cannot handle
import "./styles.css";
import { useRequestorHistory } from "./useRequestorHistory";
import { sortRequestornatorsDescending } from "./utils";

export const RequestorPage = () => {
  const { toast } = useToast();

  // Refresh routes in response to filesystem updates
  useWebsocketQueryInvalidation();

  const requestorState = useRequestor();
  // @ts-expect-error - This is helpful for debugging, soz
  globalThis.refactoredState = requestorState;
  const {
    // Routes panel
    state: { routes },
    setRoutes,
    selectRoute: handleSelectRoute, // TODO - Rename, just not sure to what
    getActiveRoute,

    // Requestor input
    // NOTE - `requestType` is an internal property used to determine if we're making a websocket request or not
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

    // Request panel - Websocket message form
    state: { websocketMessage },
    setWebsocketMessage,

    // Requests Panel tabs
    state: { activeRequestsPanelTab },
    setActiveRequestsPanelTab,
    shouldShowRequestTab,

    // Response Panel tabs
    state: { activeResponsePanelTab },
    setActiveResponsePanelTab,
    shouldShowResponseTab,
  } = requestorState;

  const selectedRoute = getActiveRoute();

  const { addBaseUrl } = useRoutes({
    setRoutes,
  });

  // NOTE - Use this to test overflow of requests panel
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

  // FIXME / INVESTIGATE - Should this behavior change for websockets?
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
          // This is a custom css class that uses the famed `auto minmax(0, 1fr)` trick
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
            // HACK - This defensively prevents overflow from getting too excessive,
            //        In the case where the inner content expands beyond the parent
            "max-w-screen",
            "max-h-full",
          )}
        >
          <RequestPanel
            activeRequestsPanelTab={activeRequestsPanelTab}
            setActiveRequestsPanelTab={setActiveRequestsPanelTab}
            shouldShowRequestTab={shouldShowRequestTab}
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
            websocketMessage={websocketMessage}
            setWebsocketMessage={setWebsocketMessage}
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
