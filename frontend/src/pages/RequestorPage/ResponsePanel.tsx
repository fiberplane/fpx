import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { cn, isJson, noop, parsePathFromRequestUrl } from "@/utils";
import {
  ArrowTopRightIcon,
  ClockIcon,
  LinkBreak2Icon,
} from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { MonacoJsonEditor } from "./Editors";
import { CodeMirrorJsonEditor } from "./Editors";
import { FpxDetails } from "./FpxDetails";
import { HeaderTable } from "./HeaderTable";
import { PanelSectionHeader } from "./RequestPanel";
import { Method, RequestorHistory, StatusCode } from "./RequestorHistory";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "./Tabs";
import { Requestornator } from "./queries";

// TODO - Create skeleton loading components for each tab content

type Props = {
  response?: Requestornator;
  isLoading: boolean;
  history: Array<Requestornator>;
  loadHistoricalRequest: (traceId: string) => void;
};

export function ResponsePanel({
  response,
  isLoading,
  history,
  loadHistoricalRequest,
}: Props) {
  const isFailure = !!response?.app_responses?.isFailure;
  return (
    <div className="overflow-hidden h-full relative">
      <Tabs
        defaultValue="body"
        className="grid grid-rows-[auto_1fr] h-full overflow-hidden"
      >
        <CustomTabsList>
          <CustomTabTrigger value="body">Response</CustomTabTrigger>
          <CustomTabTrigger value="headers">Headers</CustomTabTrigger>
          <CustomTabTrigger value="debug">Debug</CustomTabTrigger>
          <div className="flex-grow flex justify-end">
            <CustomTabTrigger value="history" className="mr-2">
              <ClockIcon className="h-3.5 w-3.5 mr-2" />
              History
            </CustomTabTrigger>
          </div>
        </CustomTabsList>
        <CustomTabsContent value="body">
          <TabContentInner
            isLoading={isLoading}
            isEmpty={!response}
            isFailure={isFailure}
            LoadingState={<LoadingResponseBody />}
            FailState={<FailedRequest response={response} />}
            EmptyState={<NoResponse />}
          >
            <ResponseSummary response={response} />
            <ResponseBody response={response} />
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="headers">
          <TabContentInner
            isLoading={isLoading}
            isEmpty={!response}
            isFailure={isFailure}
            LoadingState={<LoadingHeadersTable />}
            FailState={<FailedRequest response={response} />}
            EmptyState={<NoResponse />}
          >
            <PanelSectionHeader title="Response Headers" />
            <HeaderTable
              headers={response?.app_responses?.responseHeaders ?? {}}
            />
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="debug">
          <TabContentInner
            isLoading={isLoading}
            isEmpty={!response}
            isFailure={isFailure}
            FailState={<FailedRequest response={response} />}
            EmptyState={<NoResponse />}
          >
            <PanelSectionHeader title="Debug">
              {response?.app_responses?.traceId && (
                <Link
                  to={`/requests/${response?.app_responses?.traceId}`}
                  className="text-blue-400 hover:underline hover:text-blue-300 transition-colors flex items-center"
                >
                  View More
                  <ArrowTopRightIcon className="h-3.5 w-3.5 ml-1" />
                </Link>
              )}
            </PanelSectionHeader>
            <FpxDetails response={response} />
          </TabContentInner>
        </CustomTabsContent>
        <CustomTabsContent value="history">
          {history?.length > 0 ? (
            <RequestorHistory
              history={history}
              loadHistoricalRequest={loadHistoricalRequest}
            />
          ) : (
            <NoHistory />
          )}
        </CustomTabsContent>
      </Tabs>
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

function ResponseSummary({ response }: { response?: Requestornator }) {
  const status = response?.app_responses?.responseStatusCode;
  const method = response?.app_requests?.requestMethod;
  // const url = response?.app_requests?.requestUrl;
  const url = parsePathFromRequestUrl(
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

function ResponseBody({ response }: { response?: Requestornator }) {
  const isFailure = response?.app_responses?.isFailure;
  const body = response?.app_responses?.responseBody;

  // This means we couldn't even contact the service
  if (isFailure) {
    return <FailedRequest response={response} />;
  }

  // Special rendering for JSON
  if (body && isJson(body)) {
    const prettyBody = JSON.stringify(JSON.parse(body), null, 2);

    return (
      <div className="flex flex-grow items-stretch overflow-hidden max-w-full">
        <CodeMirrorJsonEditor value={prettyBody} readOnly onChange={noop} />
      </div>
    );

    return (
      <MonacoJsonEditor
        height="600px"
        value={prettyBody}
        readOnly
        onChange={noop}
      />
    );
  }

  // For text responses, just split into lines and render with rudimentary line numbers
  const lines =
    body?.split("\n")?.map((line, index) => (
      <div key={index} className="flex h-full">
        <span className="w-8 text-right pr-2 text-gray-500 bg-muted mr-1">
          {index + 1}
        </span>
        <span>{line}</span>
      </div>
    )) ?? [];

  // TODO - if response is empty, show that in a ux friendly way, with 204 for example

  return (
    <div className="">
      <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
        <code className="h-full">{lines}</code>
      </pre>
    </div>
  );
}

function NoHistory() {
  return (
    <div className="flex-grow flex items-center justify-center text-gray-400 mb-32 h-full max-h-[600px]">
      <div className="flex flex-col items-center justify-center p-4">
        <div className="mt-4 text-md text-white text-center">
          You have no requests in your history
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Start making some requests!
        </div>
      </div>
    </div>
  );
}

function NoResponse() {
  return (
    <div className="flex-grow flex items-center justify-center text-gray-400 mb-32 h-full max-h-[600px]">
      <div className="flex flex-col items-center justify-center p-4">
        <div className="mt-4 text-md text-white text-center">
          Enter a URL and hit send to see a response
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Or load a past request from your history
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

function LoadingHeadersTable() {
  return (
    <>
      <Skeleton className="w-full h-4" />
      <div className="flex mt-2 space-x-2">
        <Skeleton className="w-[200px] h-8" />
        <Skeleton className="flex-grow h-8" />
      </div>
      <div className="flex mt-2 space-x-2">
        <Skeleton className="w-[200px] h-8" />
        <Skeleton className="flex-grow h-8" />
      </div>
      <div className="flex mt-2 space-x-2">
        <Skeleton className="w-[200px] h-8" />
        <Skeleton className="flex-grow h-8" />
      </div>
      <div className="flex mt-2 space-x-2">
        <Skeleton className="w-[200px] h-8" />
        <Skeleton className="flex-grow h-8" />
      </div>
      <div className="flex mt-2 space-x-2">
        <Skeleton className="w-[200px] h-8" />
        <Skeleton className="flex-grow h-8" />
      </div>
    </>
  );
}

function FailedRequest({ response }: { response?: Requestornator }) {
  // TODO - Show a more friendly error message
  const failureReason = response?.app_responses?.failureReason;
  const friendlyMessage =
    failureReason === "fetch failed" ? "Service unreachable" : null;
  // const failureDetails = response?.app_responses?.failureDetails;
  return (
    <div className="flex flex-col items-center justify-center text-gray-400 max-h-[600px] w-full lg:mb-32">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-red-200" />
        <div className="mt-4 text-md text-white text-center">
          Request failed {friendlyMessage ? ` - ${friendlyMessage}` : ""}
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Make sure your api is up and has FPX Middleware enabled!
        </div>
      </div>
    </div>
  );
}
