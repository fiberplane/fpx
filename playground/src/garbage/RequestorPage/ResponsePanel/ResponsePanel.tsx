import { KeyValueTable } from "@/components/KeyValueTableV2";
import { Method } from "@/components/Method";
import { FailedRequest, ResponseBody } from "@/components/ResponseBody";
import { StatusCode } from "@/components/StatusCode";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { SENSITIVE_HEADERS, cn, parsePathFromRequestUrl } from "@/utils";
import { Icon } from "@iconify/react";
import { memo } from "react";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { ProxiedRequestResponse } from "../queries";
import { useServiceBaseUrl } from "../store";
import { useStudioStore } from "../store";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../store/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReportErrorForm } from "./ReportErrorForm";

type Props = {
  isLoading: boolean;
};

export const ResponsePanel = memo(function ResponsePanel({ isLoading }: Props) {
  const { activeResponse, activeResponsePanelTab, setActiveResponsePanelTab } =
    useStudioStore(
      "activeResponse",
      "activeResponsePanelTab",
      "setActiveResponsePanelTab",
    );

  const { removeServiceUrlFromPath } = useServiceBaseUrl();

  // NOTE - If we have a "raw" response, we want to render that, so we can (e.g.,) show binary data
  const responseToRender = activeResponse ?? undefined;
  const isFailure = responseToRender?.isFailure;

  const showBottomToolbar = !!responseToRender;

  const responseHeaders = responseToRender?.responseHeaders;

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

          {responseToRender && (
            <CustomTabTrigger value="headers">
              Headers
              {responseHeaders && Object.keys(responseHeaders).length > 1 && (
                <span className="ml-1 text-muted-foreground font-mono text-xs">
                  ({Object.keys(responseHeaders).length})
                </span>
              )}
            </CustomTabTrigger>
          )}
        </CustomTabsList>
        <CustomTabsContent value="response" className="h-full">
          <TabContentInner
            isLoading={isLoading}
            isEmpty={!responseToRender}
            isFailure={!!isFailure}
            LoadingState={<LoadingResponseBody />}
            FailState={<FailedRequest response={responseToRender} />}
            EmptyState={<NoResponse />}
          >
            <div className={cn("grid grid-rows-[auto_1fr]")}>
              <ErrorBanner activeResponse={responseToRender} />
              <ResponseBody
                response={responseToRender}
                // HACK - To support absolutely positioned bottom toolbar
                className={cn(showBottomToolbar && "pb-2")}
              />
            </div>
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="headers">
          {responseHeaders ? (
            <KeyValueTable
              sensitiveKeys={SENSITIVE_HEADERS}
              keyValue={responseHeaders}
            />
          ) : (
            !responseToRender && <NoResponse />
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
    <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 mb-2">
          <Icon
            icon="lucide:send"
            className="w-10 h-10 text-muted-foreground stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">
          Enter a URL and hit Send to see a response
        </h2>
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

function ErrorBanner({
  activeResponse,
}: {
  activeResponse: ProxiedRequestResponse | RequestorActiveResponse | undefined;
}) {
  // HACK - To appease crufty types from Studio... we don't have proxied request/responses in Playground yet
  if (!isRequestorActiveResponse(activeResponse)) {
    return null;
  }

  const statusCode = Number(activeResponse?.responseStatusCode);
  if (!statusCode || !(statusCode >= 400)) {
    return null;
  }

  const isServerError = statusCode >= 500;
  const errorType = isServerError ? "Server Error" : "Client Error";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center min-h-10 bg-destructive/10 border-destructive/20 border rounded-lg mb-2 group transition-all hover:bg-destructive/15 cursor-pointer">
          <div className="flex items-center gap-3 px-4 py-2.5 w-full">
            <div className="rounded-full bg-destructive/15 p-1.5 group-hover:bg-destructive/25 transition-colors">
              <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5 text-destructive" />
            </div>
            <span className="text-sm font-medium text-destructive">
              {errorType} - Status {statusCode}
            </span>
            <Button variant="ghost" size="sm" className="ml-auto">
              Report Issue
            </Button>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Error</DialogTitle>
        </DialogHeader>
        <ReportErrorForm
          traceId={activeResponse.traceId ?? ""}
          onSuccess={() => {
            // Close dialog on success
            const dialogEl = document.querySelector('[role="dialog"]');
            if (dialogEl) {
              const closeButton = dialogEl.querySelector<HTMLButtonElement>(
                'button[aria-label="Close"]',
              );
              closeButton?.click();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
