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
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { ResponsePanel } from "./ResponsePanel";
import { AiTestGenerationPanel, useAi } from "./ai";
import { type Requestornator, useMakeProxiedRequest } from "./queries";
import { useActiveRoute, useRequestorStore } from "./store";
import { BACKGROUND_LAYER } from "./styles";
import { useMakeWebsocketRequest } from "./useMakeWebsocketRequest";
import { useRequestorSubmitHandler } from "./useRequestorSubmitHandler";
import { sortRequestornatorsDescending } from "./utils";

interface RequestorPageContentProps {
  history: Requestornator[]; // Replace 'any[]' with the correct type
  sessionHistory: Requestornator[];
  recordRequestInSessionHistory: (traceId: string) => void;
}

export const RequestorPageContent: React.FC<RequestorPageContentProps> = ({
  history,
  sessionHistory,
  recordRequestInSessionHistory,
}) => {
  const { toast } = useToast();

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

  const isLgScreen = useIsLgScreen();

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

  const { minSize: requestPanelMinSize, maxSize: requestPanelMaxSize } =
    usePanelConstraints({
      // Change the groupId to `""` on small screens because we're not rendering
      // the resizable panel group
      groupId: "requestor-page-main-panel",
      initialGroupSize: getMainSectionHeight(),
      minPixelSize: 200,
      dimension: "height",
    });

  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "gap-2",
        "h-[calc(100%-0.6rem)]",
        "lg:h-full",
        "relative",
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
        <ResizablePanel defaultSize={isAiTestGenerationPanelOpen ? 50 : 100}>
          <ResizablePanelGroup
            direction={isLgScreen ? "horizontal" : "vertical"}
            id="requestor-page-request-panel-group"
            autoSaveId="requestor-page-request-panel-group"
            className={cn("rounded-md", "max-w-screen", "max-h-full")}
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
                  history={history}
                  toggleAiTestGenerationPanel={toggleAiTestGenerationPanel}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

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

function getMainSectionHeight() {
  return window.innerHeight - 150;
}
