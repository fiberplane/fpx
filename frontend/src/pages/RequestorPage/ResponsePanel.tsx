import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { isJson, noop } from "@/utils";
import { ClockIcon } from "@radix-ui/react-icons";
import { MonacoJsonEditor } from "./Editors";
import { CodeMirrorJsonEditor } from "./Editors";
import { FpxDetails } from "./FpxDetails";
import { HeaderTable } from "./HeaderTable";
import { RequestorHistory } from "./RequestorHistory";
import { CustomTabTrigger, CustomTabsList } from "./Tabs";
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
  return (
    <Tabs defaultValue="body" className="h-full">
      <div className="flex items-center">
        <CustomTabsList className="flex sticky top-0">
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
      </div>
      <TabsContent value="body" className="h-full">
        <div className="px-3 py-2 h-full flex max-w-full">
          {isLoading ? (
            <Loading />
          ) : response ? (
            <ResponseBody response={response} />
          ) : (
            <NoResponse />
          )}
        </div>
      </TabsContent>
      <TabsContent value="headers" className="h-full">
        <div className="px-3 py-2 h-full flex">
          {isLoading ? (
            <Loading />
          ) : response ? (
            <HeaderTable
              headers={response?.app_responses?.responseHeaders ?? {}}
            />
          ) : (
            <NoResponse />
          )}
        </div>
      </TabsContent>
      <TabsContent value="debug" className="h-full">
        <div className="px-3 py-2 h-full flex">
          {isLoading ? (
            <Loading />
          ) : response ? (
            <FpxDetails response={response} />
          ) : (
            <NoResponse />
          )}
        </div>
      </TabsContent>
      <TabsContent value="history" className="h-full">
        <div className="px-3 py-2 h-full flex flex-col">
          {history?.length > 0 ? (
            <RequestorHistory
              history={history}
              loadHistoricalRequest={loadHistoricalRequest}
            />
          ) : (
            <NoHistory />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ResponseBody({ response }: { response?: Requestornator }) {
  const body = response?.app_responses?.responseBody;

  // Special rendering for JSON
  if (body && isJson(body)) {
    const prettyBody = JSON.stringify(JSON.parse(body), null, 2);

    return (
      <div className="flex flex-grow items-stretch rounded overflow-hidden border max-w-full">
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
    <div className="flex-grow flex items-center justify-center text-gray-400 mb-32 max-h-[600px]">
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
    <div className="flex-grow flex items-center justify-center text-gray-400 mb-32 max-h-[600px]">
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
  return <Skeleton className="w-full h-32" />;
}
