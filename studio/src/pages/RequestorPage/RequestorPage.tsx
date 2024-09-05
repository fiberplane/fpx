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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams } from "react-router-dom";
import { NavigationPanel } from "./NavigationPanel";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { RequestorPageContent } from "./RequestorPageContent";
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

export const RequestorPage = () => {
  const { id } = useParams();
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

  const {
    history,
    sessionHistory,
    recordRequestInSessionHistory,
    loadHistoricalRequest,
  } = useRequestorHistory();

  const hasHistory = history.length > 0;
  useEffect(() => {
    if (id && hasHistory) {
      loadHistoricalRequest(id);
    }
  }, [id, loadHistoricalRequest, hasHistory]);

  const width = getMainSectionWidth();
  const isLgScreen = useIsLgScreen();

  const { minSize, maxSize } = usePanelConstraints({
    groupId: "requestor-page-main",
    initialGroupSize: width + 320,
    minPixelSize: 250,
    minimalGroupSize: 944,
  });

  return (
    <div
      className={cn(
        "h-[calc(100vh-40px)]",
        "flex",
        "flex-col",
        "gap-2",
        "py-4 px-2",
        "sm:px-4 sm:py-3",
        "lg:gap-4",
      )}
    >
      {/* ... existing code ... */}
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
          <RequestorPageContent
            // onSubmit={onSubmit}
            // disconnectWebsocket={disconnectWebsocket}
            // isRequestorRequesting={isRequestorRequesting}
            // formRef={formRef}
            // websocketState={websocketState}
            // isLgScreen={isLgScreen}
            // requestPanelMinSize={requestPanelMinSize}
            // requestPanelMaxSize={requestPanelMaxSize}
            // requestContent={requestContent}
            // responseContent={responseContent}
            // isAiTestGenerationPanelOpen={isAiTestGenerationPanelOpen}
            // toggleAiTestGenerationPanel={toggleAiTestGenerationPanel}
            history={history}
            sessionHistory={sessionHistory}
            recordRequestInSessionHistory={recordRequestInSessionHistory}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default RequestorPage;

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
