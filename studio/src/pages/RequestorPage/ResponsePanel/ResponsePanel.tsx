import RobotIcon from "@/assets/Robot.svg";
import { KeyValueTable } from "@/components/Timeline/DetailsList/KeyValueTableV2";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { SENSITIVE_HEADERS, cn, parsePathFromRequestUrl } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { memo } from "react";
import { Method, StatusCode } from "../RequestorHistory";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { Requestornator } from "../queries";
import type { ResponsePanelTab } from "../store";
import { useActiveRoute, useRequestorStore, useServiceBaseUrl } from "../store";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../store/types";
import { type Panels, isWsRequest } from "../types";
import type { WebSocketState } from "../useMakeWebsocketRequest";
import { FailedRequest, ResponseBody } from "./ResponseBody";
import {
  FailedWebsocket,
  NoWebsocketConnection,
  WebsocketMessages,
} from "./Websocket";

type Props = {
  tracedResponse?: Requestornator;
  isLoading: boolean;
  websocketState: WebSocketState;
  openPanels: Panels;
  togglePanel: (panelName: keyof Panels & {}) => void;
};

export const ResponsePanel = memo(function ResponsePanel({
  tracedResponse,
  isLoading,
  websocketState,
  openPanels,
  togglePanel,
}: Props) {
  const {
    activeResponse,
    visibleResponsePanelTabs,
    activeResponsePanelTab,
    setActiveResponsePanelTab,
  } = useRequestorStore(
    "activeResponse",
    "visibleResponsePanelTabs",
    "activeResponsePanelTab",
    "setActiveResponsePanelTab",
  );
  const shouldShowResponseTab = (tab: ResponsePanelTab): boolean => {
    return visibleResponsePanelTabs.includes(tab);
  };

  const { requestType } = useActiveRoute();
  const { removeServiceUrlFromPath } = useServiceBaseUrl();

  // NOTE - If we have a "raw" response, we want to render that, so we can (e.g.,) show binary data
  const responseToRender = activeResponse ?? tracedResponse;
  const isFailure = isRequestorActiveResponse(responseToRender)
    ? responseToRender.isFailure
    : responseToRender?.app_responses?.isFailure;

  const showBottomToolbar = !!responseToRender;

  const responseHeaders = isRequestorActiveResponse(responseToRender)
    ? responseToRender.responseHeaders
    : responseToRender?.app_responses?.responseHeaders;

  const shouldShowMessages = shouldShowResponseTab("messages");
  const traceId = tracedResponse?.app_responses.traceId;

  return (
    <div className="overflow-x-hidden overflow-y-auto h-full relative">
      <Tabs
        value={activeResponsePanelTab}
        onValueChange={setActiveResponsePanelTab}
        className="grid grid-rows-[auto_1fr] overflow-hidden h-full"
      >
        <CustomTabsList>
          <CustomTabTrigger value="response" className="flex items-center">
            {responseToRender ? (
              <ResponseSummary
                response={responseToRender}
                transformUrl={removeServiceUrlFromPath}
              />
            ) : (
              "Response"
            )}
          </CustomTabTrigger>
          {shouldShowMessages && (
            <CustomTabTrigger value="messages">Messages</CustomTabTrigger>
          )}
          <CustomTabTrigger value="headers">
            Headers
            {responseHeaders && Object.keys(responseHeaders).length > 1 && (
              <span className="ml-1 text-gray-400 font-mono text-xs">
                ({Object.keys(responseHeaders).length})
              </span>
            )}
          </CustomTabTrigger>

          <div className="flex-grow flex justify-end">
            <Button
              variant={openPanels.logs === "open" ? "outline" : "ghost"}
              size="icon"
              disabled={!traceId}
              onClick={() => togglePanel("logs")}
              className={cn(
                openPanels.logs === "open" && "opacity-50 bg-slate-900",
                "h-6 w-6",
              )}
              title="Show logs from the request-response lifecycle"
            >
              <Icon icon="lucide:logs" className="cursor-pointer h-4 w-4" />
            </Button>
            <Button
              variant={openPanels.timeline === "open" ? "outline" : "ghost"}
              size="icon"
              disabled={!traceId}
              onClick={() => togglePanel("timeline")}
              className={cn(
                openPanels.timeline === "open" && "opacity-50 bg-slate-900",
                "h-6 w-6",
              )}
              title="Show timeline of the response"
            >
              <Icon
                icon="lucide:chart-gantt"
                className="cursor-pointer h-4 w-4"
              />
            </Button>
            <Button
              variant={
                openPanels.aiTestGeneration === "open" ? "outline" : "ghost"
              }
              size="icon"
              onClick={() => togglePanel("aiTestGeneration")}
              className={cn(
                openPanels.aiTestGeneration === "open" &&
                  "opacity-50 bg-slate-900",
                "h-6 w-6",
              )}
              title="Show test prompt generator"
            >
              <RobotIcon className="h-3 w-3 cursor-pointer" />
            </Button>
          </div>
        </CustomTabsList>
        <CustomTabsContent value="messages">
          <TabContentInner
            isLoading={websocketState.isConnecting}
            isEmpty={
              !websocketState.isConnected && !websocketState.isConnecting
            }
            isFailure={websocketState.hasError}
            LoadingState={<LoadingResponseBody />}
            FailState={<FailedWebsocket />}
            EmptyState={<NoWebsocketConnection />}
          >
            <WebsocketMessages websocketState={websocketState} />
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="response" className="h-full">
          <TabContentInner
            isLoading={isLoading}
            isEmpty={!responseToRender}
            isFailure={
              isWsRequest(requestType) ? websocketState.hasError : !!isFailure
            }
            LoadingState={<LoadingResponseBody />}
            FailState={
              isWsRequest(requestType) ? (
                <FailedWebsocket />
              ) : (
                <FailedRequest response={tracedResponse} />
              )
            }
            EmptyState={
              isWsRequest(requestType) ? (
                <NoWebsocketConnection />
              ) : (
                <NoResponse />
              )
            }
          >
            <div className={cn("grid grid-rows-[auto_1fr]")}>
              <ResponseBody
                response={responseToRender}
                // HACK - To support absolutely positioned bottom toolbar
                className={cn(showBottomToolbar && "pb-2")}
              />
            </div>
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="headers">
          {responseHeaders && (
            <KeyValueTable
              sensitiveKeys={SENSITIVE_HEADERS}
              keyValue={responseHeaders}
            />
          )}
        </CustomTabsContent>
      </Tabs>
    </div>
  );
});

/**
 * Helper component for handling loading/failure/empty states in tab content
 */
function TabContentInner({
  isLoading,
  isEmpty,
  isFailure,
  LoadingState = <Loading />,
  EmptyState,
  FailState,
  children,
}: {
  children: React.ReactNode;
  EmptyState: JSX.Element;
  FailState: JSX.Element;
  LoadingState?: JSX.Element;
  isFailure: boolean;
  isLoading: boolean;
  isEmpty: boolean;
}) {
  return isLoading ? (
    <>{LoadingState}</>
  ) : isFailure ? (
    <>{FailState}</>
  ) : !isEmpty ? (
    <>{children}</>
  ) : (
    <>{EmptyState}</>
  );
}

function ResponseSummary({
  response,
  transformUrl = (url: string) => url,
}: {
  response?: Requestornator | RequestorActiveResponse;
  transformUrl?: (url: string) => string;
}) {
  const status = isRequestorActiveResponse(response)
    ? response?.responseStatusCode
    : response?.app_responses?.responseStatusCode;
  const method = isRequestorActiveResponse(response)
    ? response?.requestMethod
    : response?.app_requests?.requestMethod;
  const url = isRequestorActiveResponse(response)
    ? response?.requestUrl
    : parsePathFromRequestUrl(
        response?.app_requests?.requestUrl ?? "",
        response?.app_requests?.requestQueryParams ?? undefined,
      );
  return (
    <div className="flex items-center space-x-2 text-sm">
      <StatusCode status={status ?? "—"} isFailure={!status} />
      <div>
        <Method method={method ?? "—"} />
        <span
          className={cn(
            "font-mono",
            "whitespace-nowrap",
            "overflow-ellipsis",
            "text-xs",
            "ml-2",
            "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
          )}
        >
          {transformUrl(url ?? "")}
        </span>
      </div>
    </div>
  );
}

function NoResponse() {
  return (
    <div className="h-full pb-8 sm:pb-20 md:pb-32 flex flex-col items-center justify-center p-4">
      <div className="text-md text-white text-center">
        Enter a URL and hit send to see a response
      </div>
      <div className="mt-1 sm:mt-2 text-ms text-gray-400 text-center font-light">
        Or load a past request from your history
      </div>
    </div>
  );
}

function Loading() {
  return (
    <>
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-full h-32 mt-2" />
    </>
  );
}

function LoadingResponseBody() {
  return (
    <>
      <div className="flex space-x-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-8 h-4" />
        <Skeleton className="w-full h-4" />
      </div>
      <Skeleton className="w-full h-32 mt-2" />
    </>
  );
}
