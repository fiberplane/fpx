import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { isJson, noop } from "@/utils";
import { MonacoJsonEditor } from "./Editors";
import { CodeMirrorJsonEditor } from "./Editors";
import { FpxDetails } from "./FpxDetails";
import { HeaderTable } from "./HeaderTable";
import { CustomTabTrigger, CustomTabsList } from "./Tabs";
import { Requestornator } from "./queries";

// TODO - Create skeleton loading components for each tab content

export function ResponsePanel({
  response,
  isLoading,
}: { response?: Requestornator; isLoading: boolean }) {
  return (
    <Tabs defaultValue="body" className="h-full">
      <div className="flex items-center">
        <CustomTabsList>
          <CustomTabTrigger value="body">Response</CustomTabTrigger>
          <CustomTabTrigger value="headers">Headers</CustomTabTrigger>
          <CustomTabTrigger value="debug">Debug</CustomTabTrigger>
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

function NoResponse() {
  return (
    <div className="flex-grow flex items-center justify-center text-gray-400 mb-32">
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
