import { KeyValueTable } from "@/components/Timeline/DetailsList/KeyValueTableV2";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { SENSITIVE_HEADERS, cn, parsePathFromRequestUrl } from "@/utils";
import { Icon } from "@iconify/react";
import { memo } from "react";
import { Method, StatusCode } from "../RequestorHistory";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { ProxiedRequestResponse } from "../queries";
import type { ResponsePanelTab } from "../store";
import { useServiceBaseUrl } from "../store";
import { useStudioStore } from "../store";
import { useActiveRoute } from "../store/hooks/useActiveRoute";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../store/types";
import { isWsRequest } from "../types";
import type { WebSocketState } from "../useMakeWebsocketRequest";
import { FailedRequest, ResponseBody } from "./ResponseBody";
import {
  FailedWebsocket,
  NoWebsocketConnection,
  WebsocketMessages,
} from "./Websocket";

type Props = {
  tracedResponse?: ProxiedRequestResponse;
  isLoading: boolean;
  websocketState: WebSocketState;
};

export const ResponsePanel = memo(function ResponsePanel({
  tracedResponse,
  isLoading,
  websocketState,
}: Props) {
  const {
    activeResponse,
    visibleResponsePanelTabs,
    activeResponsePanelTab,
    setActiveResponsePanelTab,
  } = useStudioStore(
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

  return (
    <Tabs
      value={activeResponsePanelTab}
      onValueChange={setActiveResponsePanelTab}
      className="grid grid-rows-[auto_1fr] max-h-full"
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
      </CustomTabsList>
      <CustomTabsContent value="messages">
        <TabContentInner
          isLoading={websocketState.isConnecting}
          isEmpty={!websocketState.isConnected && !websocketState.isConnecting}
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
  response?: ProxiedRequestResponse | RequestorActiveResponse;
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
      <div className="grid grid-cols-[auto_1fr] items-center">
        <Method method={method ?? "—"} />
        <div
          className={cn(
            "font-mono",
            "whitespace-nowrap",
            "truncate",
            "text-xs",
            "ml-2",
            "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
          )}
        >
          {transformUrl(url ?? "")}
        </div>
      </div>
    </div>
  );
}

function NoResponse() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:send"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">
          Enter a URL and hit Send to see a response
        </h2>
        <div className="text-gray-400 text-left text-sm flex flex-col gap-2">
          <p>Or load a past request from your history</p>
        </div>
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
