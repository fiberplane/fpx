import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { useIsSmScreen } from "@/hooks";
import { useMemo } from "react";
import { Resizable } from "react-resizable";
import { CodeMirrorJsonEditor } from "./Editors";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { ResizableHandle } from "./Resizable";
import { CustomTabTrigger } from "./Tabs";
import { useResizableWidth, useStyleWidth } from "./hooks";

type RequestPanelProps = {
  body?: string;
  setBody: (body?: string) => void;
  queryParams: KeyValueParameter[];
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  requestHeaders: KeyValueParameter[];
};

export function RequestPanel(props: RequestPanelProps) {
  const shouldBeResizable = useIsSmScreen();

  return shouldBeResizable ? (
    <ResizableRequestMeta {...props} />
  ) : (
    <RequestMeta {...props} />
  );
}

function ResizableRequestMeta(props: RequestPanelProps) {
  const { width, handleResize } = useResizableWidth(256);
  const styleWidth = useStyleWidth(width);
  return (
    <Resizable
      className="min-w-[200px]"
      width={width} // Initial width
      axis="x" // Restrict resizing to the horizontal axis
      onResize={handleResize}
      resizeHandles={["e"]} // Limit resize handle to just the east (right) handle
      handle={(_, ref) => (
        // Render a custom handle component, so we can indicate "resizability"
        // along the entire right side of the container
        <ResizableHandle ref={ref} />
      )}
    >
      <div style={styleWidth} className="min-w-[200px] border-r">
        <RequestMeta {...props} />
      </div>
    </Resizable>
  );
}

function RequestMeta(props: RequestPanelProps) {
  const {
    body,
    setBody,
    queryParams,
    requestHeaders,
    setQueryParams,
    setRequestHeaders,
  } = props;
  return (
    <div className="min-w-[200px] border-r sm:border-none">
      <Tabs defaultValue="params">
        <div className="flex items-center">
          <TabsList className="w-full justify-start rounded-none border-b space-x-6">
            <CustomTabTrigger value="params">
              Params
              {queryParams?.length > 1 && (
                <span className="ml-1 text-gray-400 font-mono text-xs">
                  ({queryParams.length - 1})
                </span>
              )}
            </CustomTabTrigger>
            <CustomTabTrigger value="headers">
              Headers
              {requestHeaders?.length > 1 && (
                <span className="ml-1 text-gray-400 font-mono text-xs">
                  ({requestHeaders.length - 1})
                </span>
              )}
            </CustomTabTrigger>
            <CustomTabTrigger value="body">
              Body
              {(body?.length ?? 0) > 0 && (
                <span className="ml-2 w-2 h-2 inline-block rounded-full bg-orange-300" />
              )}
            </CustomTabTrigger>
          </TabsList>
        </div>
        <TabsContent value="params">
          <KeyValueForm
            keyValueParameters={queryParams}
            onChange={(params) => {
              setQueryParams(params);
            }}
          />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueForm
            keyValueParameters={requestHeaders}
            onChange={(headers) => {
              setRequestHeaders(headers);
            }}
          />
        </TabsContent>
        <TabsContent value="body">
          <CodeMirrorJsonEditor
            onChange={setBody}
            value={body}
            maxHeight="800px"
          />
          {/* <MonacoJsonEditor onChange={setBody} value={body} /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
