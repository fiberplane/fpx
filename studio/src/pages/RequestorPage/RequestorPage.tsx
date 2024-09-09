// We need some special CSS for grid layout that tailwind cannot handle
import "./styles.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/utils";
import { useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { RequestDetailsPageV2 } from "../RequestDetailsPage/RequestDetailsPageV2";
import { NavigationPanel } from "./NavigationPanel";
import { RequestorPageContent } from "./RequestorPageContent";
import { useRoutes } from "./routes";
import { useRequestorHistory } from "./useRequestorHistory";

/**
 * Estimate the size of the main section based on the window width
 */
function getMainSectionWidth() {
  return window.innerWidth - 400;
}

export const RequestorPage = () => {
  const { id, requestType } = useParams();
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
    if (id && hasHistory && requestType === "request") {
      loadHistoricalRequest(id);
    }
  }, [id, loadHistoricalRequest, hasHistory, requestType]);

  const width = getMainSectionWidth();
  const isLgScreen = useIsLgScreen();

  const { minSize, maxSize } = usePanelConstraints({
    groupId: "requestor-page-main",
    initialGroupSize: width + 320,
    minPixelSize: 250,
    minimalGroupSize: 944,
  });

  const [searchParams] = useSearchParams();
  const generateLinkToTrace = useCallback(
    (traceId: string) => {
      const search = searchParams.toString();
      return `/requestor/request/${traceId}${search ? `?${search}` : ""}`;
    },
    [searchParams],
  );

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
          {requestType === "history" && !!id ? (
            <RequestDetailsPageV2
              traceId={id}
              paginationHidden
              generateLinkToTrace={generateLinkToTrace}
            />
          ) : (
            <RequestorPageContent
              history={history}
              sessionHistory={sessionHistory}
              recordRequestInSessionHistory={recordRequestInSessionHistory}
              overrideTraceId={id}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default RequestorPage;
