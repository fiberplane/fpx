// We need some special CSS for grid layout that tailwind cannot handle
import "./styles.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useToast } from "@/components/ui/use-toast";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { NavigationPanel } from "./NavigationPanel";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { ResponsePanel } from "./ResponsePanel";
import { RoutesCombobox } from "./RoutesCombobox";
import { AiTestGenerationPanel, useAi } from "./ai";
import { type Requestornator, useMakeProxiedRequest } from "./queries";
import { useRoutes } from "./routes";
import { useActiveRoute, useRequestorStore } from "./store";
import { BACKGROUND_LAYER } from "./styles";
import { useMakeWebsocketRequest } from "./useMakeWebsocketRequest";
import { useRequestorHistory } from "./useRequestorHistory";
import { useRequestorSubmitHandler } from "./useRequestorSubmitHandler";
import { sortRequestornatorsDescending } from "./utils";

/**
 * Estimate the size of the main section based on the window width
 */
function getMainSectionWidth() {
  return window.innerWidth - 400;
}

function getMainSectionHeight() {
  return window.innerHeight - 150;
}

export const RequestorPage = () => {
  const { toast } = useToast();

  // NOTE - This sets the `routes` and `serviceBaseUrl` in the reducer
  useRoutes();

  // NOTE - Use this to test overflow of requests panel
  // useEffect(() => {
  //   setQueryParams(
  //     createKeyValueParameters(
  //       Array.from({ length: 30 }).map(() => ({ key: "a", value: "" })),
  //     ),
  //   );
  // }, []);

  const { history, sessionHistory, recordRequestInSessionHistory } =
    useRequestorHistory();

  const mostRecentRequestornatorForRoute =
    useMostRecentRequestornator(sessionHistory);

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
    makeRequest,
    connectWebsocket,
    recordRequestInSessionHistory,
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
  } = useAi(history);

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
      groupId: "requestor-page-main-panel",
      initialGroupSize: getMainSectionHeight(),
      minPixelSize: 200,
      dimension: "height",
    });

  const requestContent = (
    <RequestPanel
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
      tracedResponse={mostRecentRequestornatorForRoute}
      isLoading={isRequestorRequesting}
      websocketState={websocketState}
      openAiTestGenerationPanel={toggleAiTestGenerationPanel}
      isAiTestGenerationPanelOpen={isAiTestGenerationPanelOpen}
    />
  );

  return (
    <div
      className={cn(
        // It's critical the parent has a fixed height for our grid layout to work
        "h-[calc(100vh-40px)]",
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
        <RoutesCombobox />
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
              <NavigationPanel />
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
              // "overflow-scroll",
              "overflow-hidden",
            )}
          >
            <RequestorInput
              onSubmit={onSubmit}
              disconnectWebsocket={disconnectWebsocket}
              isRequestorRequesting={isRequestorRequesting}
              formRef={formRef}
              websocketState={websocketState}
            />
            <ResizablePanelGroup
              direction="vertical"
              id="requestor-page-main-panel"
              autoSaveId="requestor-page-main-panel"
            >
              <ResizablePanel
                defaultSize={isAiTestGenerationPanelOpen ? 50 : 100}
              >
                <ResizablePanelGroup
                  direction={isLgScreen ? "horizontal" : "vertical"}
                  id="requestor-page-request-panel-group"
                  autoSaveId="requestor-page-request-panel-group"
                  className={cn(
                    "rounded-md",
                    // HACK - This defensively prevents overflow from getting too excessive,
                    //        In the case where the inner content expands beyond the parent
                    "max-w-screen",
                    "max-h-full",
                    // "gap-1",
                  )}
                >
                  <ResizablePanel
                    order={1}
                    className={cn(BACKGROUND_LAYER, "relative")}
                    id="request-panel"
                    minSize={requestPanelMinSize}
                    maxSize={requestPanelMaxSize}
                  >
                    {requestContent}
                  </ResizablePanel>
                  <ResizableHandle
                    hitAreaMargins={{ coarse: 20, fine: 10 }}
                    className="bg-transparent"
                  />
                  <ResizablePanel
                    id="response-panel"
                    order={4}
                    minSize={10}
                    className={cn(BACKGROUND_LAYER)}
                  >
                    {responseContent}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizablePanel>
                {isAiTestGenerationPanelOpen && (
                  <>
                    <ResizableHandle
                      hitAreaMargins={{ coarse: 20, fine: 10 }}
                      className="bg-transparent"
                    />
                    <ResizablePanel
                      order={3}
                      id="ai-panel"
                      className={cn(
                        BACKGROUND_LAYER,
                        "rounded-md",
                        "border",
                        "h-full",
                        "mt-2",
                      )}
                    >
                      <AiTestGenerationPanel
                        // TODO - Only use history for recent matching route
                        history={history}
                        toggleAiTestGenerationPanel={
                          toggleAiTestGenerationPanel
                        }
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
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
function useMostRecentRequestornator(all: Requestornator[]) {
  const { path: routePath } = useActiveRoute();
  const { path, method, activeHistoryResponseTraceId } = useRequestorStore(
    "path",
    "method",
    "activeHistoryResponseTraceId",
  );
  return useMemo<Requestornator | undefined>(() => {
    if (activeHistoryResponseTraceId) {
      return all.find(
        (r: Requestornator) =>
          r?.app_responses?.traceId === activeHistoryResponseTraceId,
      );
    }

    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestRoute === routePath &&
        r?.app_requests?.requestMethod === method,
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
        r?.app_requests?.requestUrl === path &&
        r?.app_requests?.requestMethod === method,
    );

    matchingResponsesFallback?.sort(sortRequestornatorsDescending);

    return matchingResponsesFallback?.[0];
  }, [all, routePath, method, path, activeHistoryResponseTraceId]);
}

export const Title = (props: { children: React.ReactNode }) => (
  <div
    className="inline-flex items-center bg-muted p-1 text-muted-foreground w-full justify-start rounded-none border-b s
pace-x-6 h-12"
  >
    <h1
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-
all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-ev
ents-none disabled:opacity-50 py-2 px-0 text-left h-12 ml-2 text-sm border-b border-transparent font-medium tex
t-gray-100 shadow-none bg-inherit border-blue-500"
    >
      {props.children}
    </h1>
  </div>
);
