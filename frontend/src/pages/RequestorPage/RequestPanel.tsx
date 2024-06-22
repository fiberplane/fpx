import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useIsSmScreen } from "@/hooks";
import { cn } from "@/utils";
import { Resizable } from "react-resizable";
import { CodeMirrorJsonEditor } from "./Editors";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { PathParamForm } from "./PathParamForm/PathParamForm";
import { ResizableHandle } from "./Resizable";
import { CustomTabTrigger, CustomTabsList } from "./Tabs";
import { useResizableWidth, useStyleWidth } from "./hooks";

type RequestPanelProps = {
  currentRoute?: string;
  body?: string;
  setBody: (body?: string) => void;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  setPath: (path: string) => void;
  setPathParams: (params: KeyValueParameter[]) => void;
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
  const { width, handleResize } = useResizableWidth(300);
  const styleWidth = useStyleWidth(width);
  return (
    <Resizable
      className="min-w-[200px] md:flex-none"
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
    currentRoute,
    body,
    setBody,
    pathParams,
    queryParams,
    requestHeaders,
    setPath,
    setPathParams,
    setQueryParams,
    setRequestHeaders,
  } = props;
  return (
    <div className="min-w-[200px] border-r sm:border-none max-h-full">
      <Tabs
        defaultValue="params"
        className={cn("overflow-hidden overflow-y-auto max-h-full")}
      >
        <div className="flex items-center sticky top-0">
          <CustomTabsList>
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
          </CustomTabsList>
        </div>
        <div
          className={cn(
            "pt-2 pb-4 px-3",
            cn("overflow-hidden overflow-y-auto max-h-full"),
          )}
        >
          <TabsContent
            value="params"
            className={cn("overflow-hidden overflow-y-auto max-h-full")}
          >
            <div className="uppercase text-gray-400 text-sm mb-1">
              Query Parameters
            </div>
            <KeyValueForm
              keyValueParameters={queryParams}
              onChange={(params) => {
                setQueryParams(params);
              }}
            />
            {pathParams.length > 0 ? (
              <>
                <div className="uppercase text-gray-400 text-sm mt-4 mb-1">
                  Path Parameters
                </div>
                <PathParamForm
                  keyValueParameters={pathParams}
                  onChange={(params) => {
                    setPathParams(params);
                    if (!currentRoute) {
                      return;
                    }
                    let nextPath = currentRoute;
                    for (const param of params) {
                      if (!param.enabled) {
                        continue;
                      }
                      nextPath = nextPath.replace(
                        param.key,
                        param.value ?? param.key,
                      );
                    }
                    setPath(nextPath);
                  }}
                />
                <div className="h-1 w-full" />
              </>
            ) : null}
          </TabsContent>
          <TabsContent value="headers">
            <div className="uppercase text-gray-400 text-sm mb-1">
              Request Headers
            </div>
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
        </div>
      </Tabs>
    </div>
  );
}
