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
import { NavigationFrame, NavigationPanel } from "./NavigationPanel";
import { RequestorPageContent } from "./RequestorPageContent";
import { useRoutes } from "./routes";
import { useRequestorStore } from "./store";
import { useRequestorHistory } from "./useRequestorHistory";

/**
 * Estimate the size of the main section based on the window width
 */
function getMainSectionWidth() {
  return window.innerWidth - 85;
}

export const RequestorPage = () => {
  const { traceId: id, requestType } = useParams();
  // NOTE - This sets the `routes` and `serviceBaseUrl` in the reducer
  useRoutes();

  const { sidePanel } = useRequestorStore("sidePanel");

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
    groupId: "main-layout",
    initialGroupSize: width,
    minPixelSize: 250,
    minimalGroupSize: 944,
  });

  const [searchParams] = useSearchParams();
  const generateLinkToTrace = useCallback(
    (traceId: string) => {
      const search = searchParams.toString();
      return `/request/${traceId}${search ? `?${search}` : ""}`;
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
        "p-2",
        "lg:gap-4",
      )}
    >
      <ResizablePanelGroup
        direction="horizontal"
        id="main-layout"
        className="w-full"
      >
        {isLgScreen && sidePanel === "open" && (
          <>
            <ResizablePanel
              id="routes"
              order={0}
              minSize={minSize}
              maxSize={maxSize}
              defaultSize={(320 / width) * 100}
            >
              <NavigationFrame>
                <NavigationPanel />
              </NavigationFrame>
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
