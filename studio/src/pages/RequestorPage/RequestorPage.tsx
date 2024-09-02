// We need some special CSS for grid layout that tailwind cannot handle
import "./styles.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useToast } from "@/components/ui/use-toast";
import { useIsLgScreen, useIsSmScreen } from "@/hooks";
import { cn } from "@/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { ResponsePanel } from "./ResponsePanel";
import { RoutesCombobox } from "./RoutesCombobox";
import { RoutesPanel } from "./NavigationPanel/RoutesPanel";
import { AiTestGenerationPanel, useAi } from "./ai";
import { type Requestornator, useMakeProxiedRequest } from "./queries";
// import { useRequestor } from "./reducer";
import { useRequestorStore } from "./store";
import { useRoutes } from "./routes";
import { BACKGROUND_LAYER } from "./styles";
import { useMakeWebsocketRequest } from "./useMakeWebsocketRequest";
import { useRequestorHistory } from "./useRequestorHistory";
import { useRequestorSubmitHandler } from "./useRequestorSubmitHandler";
import { sortRequestornatorsDescending } from "./utils";
import { _getActiveRoute, addBaseUrl } from "./reducer/reducer";
import { useHandler } from "@fiberplane/hooks";
import { RequestsPanelTab, ResponsePanelTab } from "./reducer";

/**
 * Estimate the size of the main section based on the window width
 */
function getMainSectionWidth() {
  return window.innerWidth - 400;
}

export const RequestorPage = () => {
  const { toast } = useToast();

  const requestorState = useRequestorStore();
  // @ts-expect-error - This is helpful for debugging, soz
  globalThis.requestorState = requestorState;
  const {
    // Routes panel
    // state: { 
    routes,
    selectedRoute,
    // },
    setRoutes,
    setServiceBaseUrl,
    selectRoute: handleSelectRoute, // TODO - Rename, just not sure to what
    // getActiveRoute,

    // Requestor input
    // NOTE - `requestType` is an internal property used to determine if we're making a websocket request or not
    // state: { 
    path, method, requestType, serviceBaseUrl,
    // },
    updatePath: handlePathInputChange,
    updateMethod: handleMethodChange,
    // getIsInDraftMode,
    // addServiceUrlIfBarePath,
    // addBaseUrl,

    // Request panel
    // state: { 
    pathParams, queryParams, requestHeaders, body,
    // },
    setPathParams,
    updatePathParamValues,
    clearPathParams,
    setQueryParams,
    setRequestHeaders,
    setBody,
    handleRequestBodyTypeChange,

    // Request panel - Websocket message form
    websocketMessage,
    setWebsocketMessage,

    // Requests Panel tabs
    activeRequestsPanelTab,
    setActiveRequestsPanelTab,
    visibleRequestsPanelTabs,
    // shouldShowRequestTab,

    // Response Panel tabs
    activeResponsePanelTab,
    visibleResponsePanelTabs,
    setActiveResponsePanelTab,
    // shouldShowResponseTab,

    // Response Panel response body
    activeResponse,
    setActiveResponse,

    // History (WIP)
    activeHistoryResponseTraceId,
    showResponseBodyFromHistory,
    clearResponseBodyFromHistory,
  } = requestorState;

  const getIsInDraftMode = useCallback((): boolean => {
    return !selectedRoute;
  }, [selectedRoute]);


  const shouldShowRequestTab = useCallback(
    (tab: RequestsPanelTab): boolean => {
      return visibleRequestsPanelTabs.includes(tab);
    },
    [visibleRequestsPanelTabs],
  );

  const shouldShowResponseTab = useCallback(
    (tab: ResponsePanelTab): boolean => {
      return visibleResponsePanelTabs.includes(tab);
    },
    [visibleResponsePanelTabs],
  );


  const removeServiceUrlFromPath = useCallback((path: string) => {
    // return removeBaseUrl(serviceBaseUrl, path);
    // TODO - make this work again (this should do something with the serviceBaseUrl from the store)
    return path;
  }, [
    // serviceBaseUrl
  ]);

  // TODO - this should be a selector
  // const getActiveRoute = useHandler(() => {
  //   return selectedRoute ?? {
  //     path: "state.path",
  //     method: "GET", //state.method,
  //     requestType: "http",// state.requestType,
  //     handler: "",
  //     handlerType: "route",
  //     currentlyRegistered: false,
  //     routeOrigin: "custom",
  //     isDraft: true,
  //   }
  // });

  // TODO - this should be a thunk
  const addServiceUrlIfBarePath = useCallback(
    (path: string) => {
      return addBaseUrl(serviceBaseUrl, path, {
        requestType: requestType,
      });
    },
    [serviceBaseUrl, requestType],
  );


  // const selectedRoute = getActiveRoute();

  // NOTE - This sets the `routes` and `serviceBaseUrl` in the reducer
  useRoutes({
    setRoutes,
    setServiceBaseUrl,
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
    showResponseBodyFromHistory,
  });

  const mostRecentRequestornatorForRoute = useMostRecentRequestornator(
    { path, method, route: selectedRoute?.path },
    sessionHistory,
    activeHistoryResponseTraceId,
  );

  const { mutate: makeRequest, isPending: isRequestorRequesting } =
    useMakeProxiedRequest({ clearResponseBodyFromHistory, setActiveResponse });

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
    addServiceUrlIfBarePath,
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
  } = useAi(
    selectedRoute,
    history,
    {
      setBody,
      setQueryParams,
      setPath: handlePathInputChange,
      setRequestHeaders,
      updatePathParamValues,
      addServiceUrlIfBarePath,
    },
    body,
  );

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

  const [isAiTestGenerationPanelOpen, setIsAiTestGenerationPanelOpen] =
    useState(false);
  const toggleAiTestGenerationPanel = useCallback(
    () => setIsAiTestGenerationPanelOpen((current) => !current),
    [],
  );

  const width = getMainSectionWidth();
  const isSmallScreen = useIsSmScreen();
  const isLgScreen = useIsLgScreen();

  const { minSize, maxSize } = usePanelConstraints({
    groupId: "requestor-page-main",
    initialGroupSize: width + 320,
    minPixelSize: 250,
    minimalGroupSize: 944,
  });

  const { minSize: requestPanelMinSize, maxSize: requestPanelMaxSize } =
    usePanelConstraints({
      // Change the groupId to `""` on small screens because we're not rendering
      // the resizable panel group
      groupId: isSmallScreen ? "" : "requestor-page-main-panel",
      initialGroupSize: width,
      minPixelSize: 300,
    });

  const requestContent = (
    <RequestPanel
      activeRequestsPanelTab={activeRequestsPanelTab}
      setActiveRequestsPanelTab={setActiveRequestsPanelTab}
      shouldShowRequestTab={shouldShowRequestTab}
      path={path}
      method={method}
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
  );

  const responseContent = (
    <ResponsePanel
      activeResponse={activeResponse}
      tracedResponse={mostRecentRequestornatorForRoute}
      activeResponsePanelTab={activeResponsePanelTab}
      setActiveResponsePanelTab={setActiveResponsePanelTab}
      shouldShowResponseTab={shouldShowResponseTab}
      isLoading={isRequestorRequesting}
      websocketState={websocketState}
      requestType={selectedRoute?.requestType}
      openAiTestGenerationPanel={toggleAiTestGenerationPanel}
      isAiTestGenerationPanelOpen={isAiTestGenerationPanelOpen}
      removeServiceUrlFromPath={removeServiceUrlFromPath}
    />
  );

  return (
    <div
      className={cn(
        // It's critical the parent has a fixed height for our grid layout to work
        "h-[calc(100vh-64px)]",
        "flex",
        "flex-col",
        "gap-2",
        "py-4 px-2",
        "sm:px-4 sm:py-3",
        "lg:gap-4",
      )}
    >
      <div
        className={cn(
          "relative",
          "lg:overflow-y-auto",
          "lg:overflow-x-hidden",
          "lg:hidden",
        )}
      >
        <RoutesCombobox
          routes={routes}
          selectedRoute={selectedRoute}
          handleRouteClick={handleSelectRoute}
        />
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        id="requestor-page-main"
        autoSaveId="requestor-page-main"
        className="w-full"
      >
        {isLgScreen && (
          <>
            <ResizablePanel
              id="routes"
              order={0}
              minSize={minSize}
              maxSize={maxSize}
              defaultSize={(320 / width) * 100}
            >
              <RoutesPanel
                routes={routes}
                selectedRoute={selectedRoute}
                handleRouteClick={handleSelectRoute}
                history={history}
                loadHistoricalRequest={loadHistoricalRequest}
                removeServiceUrlFromPath={removeServiceUrlFromPath}
              />
            </ResizablePanel>
            <ResizableHandle
              hitAreaMargins={{ coarse: 20, fine: 10 }}
              className="mr-2 w-0"
            />
          </>
        )}
        <ResizablePanel id="main" order={1}>
          <div
            className={cn(
              "flex",
              "flex-col",
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
            {isSmallScreen ? (
              <>
                {requestContent}
                {responseContent}
              </>
            ) : (
              <ResizablePanelGroup
                direction={isSmallScreen ? "vertical" : "horizontal"}
                id="requestor-page-main-panel"
                autoSaveId="requestor-page-main-panel"
                className={cn(
                  BACKGROUND_LAYER,
                  "rounded-md",
                  "border",
                  // HACK - This defensively prevents overflow from getting too excessive,
                  //        In the case where the inner content expands beyond the parent
                  "max-w-screen",
                  "max-h-full",
                )}
              >
                <ResizablePanel
                  order={1}
                  className="relative"
                  id="request-panel"
                  defaultSize={
                    width < 624 || requestPanelMinSize === undefined
                      ? undefined
                      : Math.max(requestPanelMinSize, 33)
                  }
                  minSize={requestPanelMinSize}
                  maxSize={requestPanelMaxSize}
                >
                  {requestContent}
                </ResizablePanel>
                <ResizableHandle hitAreaMargins={{ coarse: 20, fine: 10 }} />
                <ResizablePanel id="response-panel" order={4} minSize={10}>
                  {responseContent}
                </ResizablePanel>
                {isAiTestGenerationPanelOpen && !isSmallScreen && (
                  <>
                    <ResizableHandle
                      hitAreaMargins={{ coarse: 20, fine: 10 }}
                    />
                    <ResizablePanel order={3} id="ai-panel">
                      <AiTestGenerationPanel
                        // TODO - Only use history for recent matching route
                        history={history}
                        toggleAiTestGenerationPanel={
                          toggleAiTestGenerationPanel
                        }
                        // getActiveRoute={getActiveRoute}
                        removeServiceUrlFromPath={removeServiceUrlFromPath}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default RequestorPage;

/**
 * When you select a route from the route side panel,
 * this will look for the most recent request made against that route.
 */
function useMostRecentRequestornator(
  requestInputs: { path: string; method: string; route?: string },
  all: Requestornator[],
  activeHistoryResponseTraceId: string | null,
) {
  return useMemo<Requestornator | undefined>(() => {
    if (activeHistoryResponseTraceId) {
      return all.find(
        (r: Requestornator) =>
          r?.app_responses?.traceId === activeHistoryResponseTraceId,
      );
    }

    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestRoute === requestInputs.route &&
        r?.app_requests?.requestMethod === requestInputs.method,
    );

    // Descending sort by updatedAt
    matchingResponses?.sort(sortRequestornatorsDescending);

    const latestMatch = matchingResponses?.[0];

    if (latestMatch) {
      return latestMatch;
    }

    // HACK - We can try to match against the exact request URL
    //        This is a fallback to support the case where the route doesn't exist,
    //        perhaps because we made a request to a service we are not explicitly monitoring
    const matchingResponsesFallback = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestUrl === requestInputs.path &&
        r?.app_requests?.requestMethod === requestInputs.method,
    );

    matchingResponsesFallback?.sort(sortRequestornatorsDescending);

    return matchingResponsesFallback?.[0];
  }, [all, requestInputs, activeHistoryResponseTraceId]);
}

export const Title = (props: { children: React.ReactNode }) => (
  <div
    className="inline-flex items-center bg-muted p-1 text-muted-foreground w-full justify-start rounded-none border-b s
pace-x-6 h-12"
  >
    <h1
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-
all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-ev
ents-none disabled:opacity-50 py-2 px-0 text-left h-12 ml-2 text-sm font-normal border-b border-transparent font-medium tex
t-gray-100 shadow-none bg-inherit rounded-none border-blue-500"
    >
      {props.children}
    </h1>
  </div>
);
