import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useToast } from "@/components/ui/use-toast";
import { useActiveTraceId, useIsLgScreen, useKeySequence } from "@/hooks";
import { cn } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { To } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AiPromptInput, CommandBar } from "../CommandBar";
import { RequestPanel } from "../RequestPanel";
import { RequestorInput } from "../RequestorInput";
import { ResponsePanel } from "../ResponsePanel";
import { useAi } from "../ai";
import { type ProxiedRequestResponse, useMakeProxiedRequest } from "../queries";
import { useStudioStore, useStudioStoreRaw } from "../store";
import { BACKGROUND_LAYER } from "../styles";
import { useMakeWebsocketRequest } from "../useMakeWebsocketRequest";
import { useRequestorSubmitHandler } from "../useRequestorSubmitHandler";
import RequestorPageContentBottomPanel from "./RequestorPageContentBottomPanel";
import { useMostRecentProxiedRequestResponse } from "./useMostRecentProxiedRequestResponse";
import { getMainSectionWidth } from "./util";

type RequestorPageContentProps = {
  history: ProxiedRequestResponse[];
  historyLoading: boolean;
  overrideTraceId?: string;
  generateNavigation: (traceId: string) => To;
};

export const RequestorPageContent: React.FC<RequestorPageContentProps> = (
  props,
) => {
  const { history, overrideTraceId, historyLoading, generateNavigation } =
    props;

  const activeTraceId = useActiveTraceId();
  const item = history.find((element) => getId(element) === activeTraceId);

  const { setRequestParams } = useStudioStore("setRequestParams");
  useEffect(() => {
    if (!item) {
      return;
    }

    setRequestParams(item.app_requests);
  }, [item, setRequestParams]);

  const { toast } = useToast();

  const mostRecentProxiedRequestResponseForRoute =
    useMostRecentProxiedRequestResponse(history, overrideTraceId);

  // This is the preferred traceId to show in the UI
  // It is either the traceId from the url or a recent traceId from the session history
  const traceId =
    overrideTraceId ??
    mostRecentProxiedRequestResponseForRoute?.app_responses?.traceId;

  // const { setActiveHistoryResponseTraceId, activeHistoryResponseTraceId } =
  //   useRequestorStore(
  //     // "setActiveHistoryResponseTraceId",
  //     // "activeHistoryResponseTraceId",
  //   );
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (traceId
  //     // && traceId !== activeHistoryResponseTraceId
  //     ) {
  //     // setActiveHistoryResponseTraceId(traceId);
  //     navigate(generateNavigation(traceId), { replace: true });
  //   }
  // }, [
  //   traceId,
  //   activeHistoryResponseTraceId,
  //   generateNavigation,
  //   navigate,
  //   setActiveHistoryResponseTraceId,
  // ]);

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
    generateNavigation,
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

  const isLgScreen = useIsLgScreen();

  const { togglePanel, setAIDropdownOpen, setAiPrompt } = useStudioStore(
    "togglePanel",
    "setAIDropdownOpen",
    "setAiPrompt",
  );

  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);

  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      setCommandBarOpen(true);
    },
    {
      enableOnFormTags: ["input"],
    },
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
      } else {
        e.preventDefault();
        setAIDropdownOpen(true);
      }
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  useHotkeys(
    "mod+shift+g",
    (e) => {
      e.preventDefault();
      if (aiEnabled) {
        setAiPromptOpen(true);
      } else {
        setAIDropdownOpen(true);
      }
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  useKeySequence(
    ["g", "l"],
    () => {
      togglePanel("logsPanel");
    },
    { description: "Open logs panel", ignoreSelector: "[contenteditable]" },
  );

  useKeySequence(
    ["g", "t"],
    () => {
      togglePanel("timelinePanel");
    },
    { description: "Open timeline panel", ignoreSelector: "[contenteditable]" },
  );

  useKeySequence(
    ["g", "i"],
    () => {
      togglePanel("aiPanel");
    },
    {
      description: "Open AI assistant panel",
      ignoreSelector: "[contenteditable]",
    },
  );

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
      onSubmit={onSubmit}
    />
  );

  const responseContent = (
    <ResponsePanel
      tracedResponse={mostRecentProxiedRequestResponseForRoute}
      isLoading={isRequestorRequesting || historyLoading}
      websocketState={websocketState}
    />
  );

  const { minSize: requestPanelMinSize, maxSize: requestPanelMaxSize } =
    usePanelConstraints({
      // Change the groupId to `""` on small screens because we're not rendering
      // the resizable panel group
      groupId: "requestor-page-request-panel-group",
      initialGroupSize: getMainSectionWidth(),
      minPixelSize: 200,
      dimension: "width",
    });

  const bottomPanelVisible = useStudioStoreRaw(
    useShallow((state) => {
      return state.bottomPanelIndex !== undefined;
    }),
  );

  const bottomPanel = bottomPanelVisible ? (
    <RequestorPageContentBottomPanel traceId={traceId} history={history} />
  ) : null;

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
      <AiPromptInput
        open={aiPromptOpen}
        setOpen={setAiPromptOpen}
        setAiPrompt={setAiPrompt}
        onGenerateRequest={(prompt) => {
          if (aiEnabled && !isLoadingParameters) {
            toast({
              duration: 3000,
              description: prompt
                ? "Generating request with user instructions"
                : "Generating request parameters with AI",
            });
            fillInRequest();
          }
        }}
      />
      <CommandBar open={commandBarOpen} setOpen={setCommandBarOpen} />
      <RequestorInput
        onSubmit={onSubmit}
        disconnectWebsocket={disconnectWebsocket}
        isRequestorRequesting={isRequestorRequesting}
        formRef={formRef}
        websocketState={websocketState}
      />
      <ResizablePanelGroup direction="vertical" id="content-panels">
        <ResizablePanel order={0} id="top-panels">
          <ResizablePanelGroup
            direction={isLgScreen ? "horizontal" : "vertical"}
            id="requestor-page-request-panel-group"
            className={cn("rounded-md", "max-w-screen", "max-h-full")}
          >
            <ResizablePanel
              order={1}
              className={cn(BACKGROUND_LAYER, "relative")}
              id="request-panel"
              minSize={
                requestPanelMinSize
                  ? Math.min(100, requestPanelMinSize)
                  : undefined
              }
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
        {bottomPanel && (
          <>
            <ResizableHandle
              hitAreaMargins={{ coarse: 15, fine: 10 }}
              className="mb-0.5 h-0"
            />
            <ResizablePanel order={2} id="bottom-panel">
              <div
                className={cn(
                  "rounded-md",
                  "border",
                  "h-full",
                  "mt-2",
                  BACKGROUND_LAYER,
                )}
              >
                {bottomPanel}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

const getId = (item: ProxiedRequestResponse) => {
  return item.app_responses?.traceId || item.app_requests.id.toString();
};
