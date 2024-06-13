import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import Editor, { loader } from "@monaco-editor/react";
import { CodeIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { customTheme } from "./Editor";
import { Requestornator } from "./queries";

import "react-resizable/css/styles.css"; // Import the styles for the resizable component
import { HeaderTable } from "./HeaderTable";
import { CustomTabTrigger } from "./Tabs";

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

export function ResponseDetails({ response }: { response?: Requestornator }) {
  return (
    <Tabs defaultValue="body" className="h-full">
      <div className="flex items-center">
        <TabsList className="w-full justify-start rounded-none border-b space-x-6">
          <CustomTabTrigger value="body">Response</CustomTabTrigger>
          <CustomTabTrigger value="headers">Headers</CustomTabTrigger>
          <CustomTabTrigger value="fpx">FPX</CustomTabTrigger>
        </TabsList>
      </div>
      <TabsContent value="body" className="h-full">
        <div className="px-3 h-full">
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
      <TabsContent value="fpx">COME BACK SOON HOMIE!</TabsContent>
    </Tabs>
  );

  return (
    <div className="flex-grow flex flex-col">
      <div className="flex items-center space-x-2 h-9 bg-muted px-2 py-1 border-b">
        <div className="text-sm font-medium">Response</div>
      </div>
    </div>
  );
}

function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
}

function ResponseBody({ response }: { response?: Requestornator }) {
  const body = response?.app_responses?.responseBody;

  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("customTheme", customTheme);
      monaco.editor.setTheme("customTheme");
    });
  }, []);

  // Special rendering for JSON
  if (body && isJson(body)) {
    const prettyBody = JSON.stringify(JSON.parse(body), null, 2);
    return (
      <Editor
        height="600px"
        defaultLanguage="json"
        value={prettyBody}
        options={{
          minimap: { enabled: false },
          tabSize: 2,
          codeLens: false,
          scrollbar: { vertical: "auto", horizontal: "hidden" },
          theme: "vs-light",
          padding: {
            top: 0,
            bottom: 0,
          },
          lineNumbersMinChars: 3,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          readOnly: true,
          automaticLayout: true,
        }}
      />
    );
  }

  const lines =
    body?.split("\n")?.map((line, index) => (
      <div key={index} className="flex h-full">
        <span className="w-8 text-right pr-2 text-gray-600 bg-muted mr-1">
          {index + 1}
        </span>
        <span>{line}</span>
      </div>
    )) ?? [];

  // TODO - if response is empty, show that in a ux friendly way

  return (
    <div className="mt-4">
      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
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
