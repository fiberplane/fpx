import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Resizable } from "react-resizable";
import { CodeMirrorJsonEditor } from "./Editors";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { ResizableHandle } from "./Resizable";
import { CustomTabTrigger } from "./Tabs";
import { useResizableWidth } from "./hooks";

type RequestPanelProps = {
  body?: string;
  setBody: (body?: string) => void;
  queryParams: KeyValueParameter[];
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  requestHeaders: KeyValueParameter[];
};

export function RequestPanel(props: RequestPanelProps) {
  const {
    body,
    setBody,
    queryParams,
    requestHeaders,
    setQueryParams,
    setRequestHeaders,
  } = props;

  const { width, handleResize } = useResizableWidth(256);

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
      <div style={{ width: `${width}px` }} className="min-w-[350px] border-r">
        <Tabs defaultValue="params">
          <div className="flex items-center">
            <TabsList className="w-full justify-start rounded-none border-b space-x-6">
              <CustomTabTrigger value="params">Params</CustomTabTrigger>
              <CustomTabTrigger value="headers">Headers</CustomTabTrigger>
              <CustomTabTrigger value="body">Body</CustomTabTrigger>
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
    </Resizable>
  );
}
