import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useIsSmScreen } from "@/hooks";
import { cn } from "@/utils";
import { EraserIcon } from "@radix-ui/react-icons";
import { Resizable } from "react-resizable";
import { CodeMirrorJsonEditor } from "./Editors";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { PathParamForm } from "./PathParamForm/PathParamForm";
import { ResizableHandle } from "./Resizable";
import { CustomTabTrigger, CustomTabsList } from "./Tabs";
import { useResizableWidth, useStyleWidth } from "./hooks";

type RequestPanelProps = {
  currentRoute?: string;
  method: string;
  body?: string;
  setBody: (body?: string) => void;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  setPath: (path: string) => void;
  setPathParams: React.Dispatch<React.SetStateAction<KeyValueParameter[]>>;
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
    method,
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
  const shouldShowBody = method !== "GET" && method !== "HEAD";
  return (
    <div className="min-w-[200px] border-r sm:border-none max-h-full">
      <Tabs
        defaultValue="params"
        className={cn("overflow-hidden overflow-y-auto max-h-full")}
      >
        <div className="flex items-center">
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
            {shouldShowBody && (
              <CustomTabTrigger value="body">
                Body
                {(body?.length ?? 0) > 0 && (
                  <span className="ml-2 w-2 h-2 inline-block rounded-full bg-orange-300" />
                )}
              </CustomTabTrigger>
            )}
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
            className={cn(
              "overflow-hidden overflow-y-auto max-h-full",
              // NOTE - Needs bottom padding to avoid clipping the input of the last item
              "pb-1",
            )}
          >
            <div className="uppercase text-gray-400 text-sm mb-1 flex items-center justify-between">
              <span>Query Parameters</span>

              <EraserIcon
                className="h-3.5 w-3.5 cursor-pointer hover:text-white transition-color"
                onClick={() => {
                  setQueryParams([]);
                }}
              />
            </div>
            <KeyValueForm
              keyValueParameters={queryParams}
              onChange={(params) => {
                setQueryParams(params);
              }}
            />
            {pathParams.length > 0 ? (
              <>
                <PanelSectionHeader
                  title="Path parameters"
                  handleClearData={() => {
                    setPathParams((currentPathParams) => {
                      return currentPathParams.map((param) => {
                        return {
                          ...param,
                          value: "",
                          enabled: false,
                        };
                      });
                    });
                  }}
                  className="mt-4"
                />
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
              </>
            ) : null}
          </TabsContent>
          <TabsContent value="headers">
            <PanelSectionHeader
              title="Request Headers"
              handleClearData={() => {
                setRequestHeaders([]);
              }}
            />
            <KeyValueForm
              keyValueParameters={requestHeaders}
              onChange={(headers) => {
                setRequestHeaders(headers);
              }}
            />
          </TabsContent>
          {shouldShowBody && (
            <TabsContent value="body">
              <PanelSectionHeader
                title="Request Body"
                handleClearData={() => {
                  setBody(undefined);
                }}
                className="mb-2"
              />
              <CodeMirrorJsonEditor
                onChange={setBody}
                value={body}
                maxHeight="800px"
              />
              {/* <MonacoJsonEditor onChange={setBody} value={body} /> */}
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}

export function PanelSectionHeader({
  title,
  handleClearData,
  className,
}: { title: string; handleClearData: () => void; className?: string }) {
  return (
    <div
      className={cn(
        "uppercase text-gray-400 text-sm mb-1 flex items-center justify-between",
        className,
      )}
    >
      <span>{title}</span>

      <EraserIcon
        className="h-3.5 w-3.5 cursor-pointer hover:text-white transition-color"
        onClick={() => {
          handleClearData();
        }}
      />
    </div>
  );
}
