import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import RobotIcon from "@/assets/Robot.svg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { SENSITIVE_HEADERS, cn, parsePathFromRequestUrl } from "@/utils";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { CollapsibleKeyValueTableV2 } from "../../RequestDetailsPage/v2/KeyValueTableV2";
import { FpxDetails } from "../FpxDetails";
import { Method, StatusCode } from "../RequestorHistory";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import { AiTestGenerationDrawer } from "../ai";
import type { Requestornator } from "../queries";
import type { ResponsePanelTab } from "../reducer";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../reducer/state";
import { type RequestType, isWsRequest } from "../types";
import type { WebSocketState } from "../useMakeWebsocketRequest";
import { FailedRequest, ResponseBody } from "./ResponseBody";
import {
  FailedWebsocket,
  NoWebsocketConnection,
  WebsocketMessages,
} from "./Websocket";

type Props = {
  activeResponse: RequestorActiveResponse | null;
  activeResponsePanelTab: ResponsePanelTab;
  setActiveResponsePanelTab: (tab: string) => void;
  shouldShowResponseTab: (tab: ResponsePanelTab) => boolean;
  tracedResponse?: Requestornator;
  isLoading: boolean;
  requestType: RequestType;
  websocketState: WebSocketState;
  openAiTestGenerationPanel: () => void;
  isAiTestGenerationPanelOpen: boolean;
};

export function ResponsePanel({
  activeResponse,
  activeResponsePanelTab,
  setActiveResponsePanelTab,
  shouldShowResponseTab,
  tracedResponse,
  isLoading,
  requestType,
  websocketState,
  openAiTestGenerationPanel,
  isAiTestGenerationPanelOpen,
}: Props) {
  // NOTE - If we have a "raw" response, we want to render that, so we can (e.g.,) show binary data
  const responseToRender = activeResponse ?? tracedResponse;

  const isFailure = isRequestorActiveResponse(responseToRender)
    ? responseToRender.isFailure
    : responseToRender?.app_responses?.isFailure;

  // FIXME - This should actually look if the trace exists in the database
  //         Since a trace ID will still be created even if we request a non-existent route OR against a service that doesn't exist
  const hasTraceId = isRequestorActiveResponse(responseToRender)
    ? !!responseToRender?.traceId
    : !!responseToRender?.app_responses?.traceId;

  const showBottomToolbar = !!responseToRender;
  const disableGoToTraceButton = !hasTraceId;

  const responseHeaders = isRequestorActiveResponse(responseToRender)
    ? responseToRender.responseHeaders
    : responseToRender?.app_responses?.responseHeaders;

  const shouldShowMessages = shouldShowResponseTab("messages");

  return (
    <div className="overflow-hidden h-full relative">
      <Tabs
        value={activeResponsePanelTab}
        onValueChange={setActiveResponsePanelTab}
        className="grid grid-rows-[auto_1fr] h-full overflow-hidden"
      >
        <CustomTabsList>
          <CustomTabTrigger value="response">Response</CustomTabTrigger>
          {shouldShowMessages && (
            <CustomTabTrigger value="messages">Messages</CustomTabTrigger>
          )}
          <CustomTabTrigger value="debug">Debug</CustomTabTrigger>
          <div
            className={cn(
              // Hide this button on mobile, and rely on the button + drawer pattern instead
              "max-sm:hidden",
              "flex-grow sm:flex justify-end",
            )}
          >
            <Button
              variant={isAiTestGenerationPanelOpen ? "outline" : "ghost"}
              size="icon"
              onClick={openAiTestGenerationPanel}
              className={cn(
                isAiTestGenerationPanelOpen && "opacity-50 bg-slate-900",
              )}
            >
              <RobotIcon className="h-4 w-4 cursor-pointer" />
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
        <CustomTabsContent value="response">
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
            <div className={cn("h-full grid grid-rows-[auto_1fr]")}>
              <ResponseSummary response={responseToRender} />
              <ResponseBody
                headersSlot={
                  <CollapsibleKeyValueTableV2
                    sensitiveKeys={SENSITIVE_HEADERS}
                    title="Headers"
                    keyValue={responseHeaders ?? {}}
                    className="mb-2"
                  />
                }
                response={responseToRender}
                // HACK - To support absolutely positioned bottom toolbar
                className={cn(showBottomToolbar && "pb-16")}
              />
              {showBottomToolbar && (
                <BottomToolbar
                  response={tracedResponse}
                  disableGoToTraceButton={disableGoToTraceButton}
                />
              )}
            </div>
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="debug">
          <TabContentInner
            isLoading={isLoading}
            isEmpty={!tracedResponse}
            isFailure={!!isFailure}
            FailState={<FailedRequest response={tracedResponse} />}
            EmptyState={<NoResponse />}
          >
            <div className={cn("h-full")}>
              <FpxDetails
                response={tracedResponse}
                // HACK - Allows for absolute positioned toolbar
                className={cn(showBottomToolbar && "pb-16")}
              />
              {showBottomToolbar && (
                <BottomToolbar
                  response={tracedResponse}
                  disableGoToTraceButton={disableGoToTraceButton}
                />
              )}
            </div>
          </TabContentInner>
        </CustomTabsContent>
      </Tabs>
    </div>
  );
}

// TODO - When there's no matching trace, don't allow the user to go to trace details
const BottomToolbar = ({
  response,
  disableGoToTraceButton,
}: { response?: Requestornator | null; disableGoToTraceButton: boolean }) => {
  const traceId = response?.app_responses?.traceId;

  return (
    <div className="flex justify-end gap-2 h-12 absolute w-full bottom-0 right-0 px-3 pt-1 backdrop-blur-sm">
      <div className="sm:hidden">
        <AiTestGenerationDrawer history={response ? [response] : null} />
      </div>
      <Link
        to={`/requests/otel/${traceId}`}
        className={cn(disableGoToTraceButton && "pointer-events-none")}
      >
        <Button variant="secondary" disabled={disableGoToTraceButton}>
          {disableGoToTraceButton ? (
            "Cannot Find Trace"
          ) : (
            <>
              Go to Trace Details
              <ArrowTopRightIcon className="h-3.5 w-3.5 ml-1" />
            </>
          )}
        </Button>
      </Link>
    </div>
  );
};

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
}: { response?: Requestornator | RequestorActiveResponse }) {
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
    <div className="flex items-center mb-4 space-x-2 text-sm">
      <StatusCode status={status ?? "—"} isFailure={!status} />
      <div>
        <Method method={method ?? "—"} />
        <span
          className={cn(
            "font-mono",
            "whitespace-nowrap",
            "overflow-ellipsis",
            "ml-2",
            "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
          )}
        >
          {url}
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
