import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { isJson, noop } from "@/utils";
import { CodeIcon } from "@radix-ui/react-icons";
import { MonacoJsonEditor } from "./Editors";
import { CodeMirrorJsonEditor } from "./Editors";
import { FpxDetails } from "./FpxDetails";
import { HeaderTable } from "./HeaderTable";
import { CustomTabTrigger } from "./Tabs";
import { Requestornator } from "./queries";

export function ResponseDetails({ response }: { response?: Requestornator }) {
  return (
    <Tabs defaultValue="body" className="h-full">
      <div className="flex items-center">
        <TabsList className="w-full justify-start rounded-none border-b space-x-6">
          <CustomTabTrigger value="body">Response</CustomTabTrigger>
          <CustomTabTrigger value="headers">Headers</CustomTabTrigger>
          <CustomTabTrigger value="debug">Debug</CustomTabTrigger>
        </TabsList>
      </div>
      <TabsContent value="body" className="h-full">
        <div className="px-3 h-full flex max-w-full">
          {response ? (
            <ResponseBody response={response} />
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-400">
              <NoResponse />
            </div>
          )}
        </div>
      </TabsContent>
      <TabsContent value="headers">
        <div className="px-1">
          {response?.app_responses?.responseHeaders ? (
            <HeaderTable
              headers={response?.app_responses?.responseHeaders ?? {}}
            />
          ) : (
            <NoHeaders />
          )}
        </div>
      </TabsContent>
      <TabsContent value="debug">
        <div className="px-3 py-1">
          <FpxDetails response={response} />
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

  // TODO - if response is empty, show that in a ux friendly way

  return (
    <div className="mt-4">
      <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
        <code className="h-full">{lines}</code>
      </pre>
    </div>
  );
}

const NoResponse = () => (
  <div className="flex flex-col items-center justify-center p-4">
    <div className="text-gray-400">No response yet</div>
  </div>
);

const NoHeaders = () => (
  <div className="flex flex-col items-center justify-center p-4">
    <div className="text-gray-400">No headers... yet?!</div>
  </div>
);

export function ResponseInstructions() {
  return (
    <div className="flex-grow flex items-center justify-center text-gray-400 mb-32">
      <div className="flex flex-col items-center justify-center p-4 ">
        <CodeIcon className="w-10 h-10" />
        <div className="text-gray-600 mt-4 text-xl">No response yet</div>
        <div className="text-gray-600 mt-2">
          Send a request to see a response!
        </div>
      </div>
    </div>
  );
}
