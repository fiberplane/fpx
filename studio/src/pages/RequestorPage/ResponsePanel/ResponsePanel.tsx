import RobotIcon from "@/assets/Robot.svg";
import {
  CollapsibleKeyValueTableV2,
  SubSectionHeading,
} from "@/components/Timeline";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { SENSITIVE_HEADERS, cn, parsePathFromRequestUrl } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Method, StatusCode } from "../RequestorHistory";
import { RequestorTimeline } from "../RequestorTimeline";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
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
  removeServiceUrlFromPath: (url: string) => string;
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
  removeServiceUrlFromPath,
}: Props) {
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

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="overflow-x-hidden overflow-y-auto h-full relative">
      <div className="h-full">
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
              <div
                className={cn(
                  "grid grid-rows-[auto_1fr]",
                  traceId && "grid-rows-[auto_1fr_auto]",
                )}
              >
                <ResponseBody
                  headersSlot={
                    <CollapsibleKeyValueTableV2
                      sensitiveKeys={SENSITIVE_HEADERS}
                      title="Headers"
                      keyValue={responseHeaders ?? {}}
                      className="mb-0.5 pb-2"
                    />
                  }
                  response={responseToRender}
                  // HACK - To support absolutely positioned bottom toolbar
                  className={cn(showBottomToolbar && "pb-2")}
                />
                {traceId && (
                  <Collapsible
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    className="pl-0 border-t pt-2.5 mt-0.5"
                  >
                    <CollapsibleTrigger asChild className="mb-2">
                      <SubSectionHeading className="flex items-center gap-2 cursor-pointer">
                        {isOpen ? (
                          <CaretDownIcon className="w-4 h-4 cursor-pointer" />
                        ) : (
                          <CaretRightIcon className="w-4 h-4 cursor-pointer" />
                        )}
                        Timeline
                      </SubSectionHeading>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <RequestorTimeline traceId={traceId} />
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </TabContentInner>
          </CustomTabsContent>
        </Tabs>
      </div>
    </div>
  );
}

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
