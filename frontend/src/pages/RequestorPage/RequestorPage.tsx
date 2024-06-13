import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import Editor, { loader } from "@monaco-editor/react";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import {
  ComponentProps,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Resizable, ResizeCallbackData } from "react-resizable";
import { customTheme } from "./Editor";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import {
  type ProbedRoute,
  Requestornator,
  getUrl,
  useFetchRequestorRequests,
  useMakeRequest,
  useProbedRoutes,
} from "./queries";

import "react-resizable/css/styles.css"; // Import the styles for the resizable component
import { HeaderTable } from "./HeaderTable";
import { useRequestorFormData } from "./data";

// import { RequestMethodCombobox } from "./RequestMethodCombobox";

function useAutoselectRoute({
  isLoading,
  routes,
}: { isLoading: boolean; routes?: ProbedRoute[] }) {
  const [selectedRoute, setSelectedRoute] = useState<ProbedRoute | null>(null);

  useEffect(() => {
    const shouldAutoselectRoute =
      !isLoading && routes?.length && selectedRoute === null;
    if (shouldAutoselectRoute) {
      const autoselectedRoute = routes.find((r) => r.path === "/") ?? routes[0];
      setSelectedRoute(autoselectedRoute);
    }
  }, [routes, isLoading, selectedRoute]);

  return { selectedRoute, setSelectedRoute };
}

export const RequestorPage = () => {
  const { data: routes, isLoading } = useProbedRoutes();

  const { selectedRoute, setSelectedRoute } = useAutoselectRoute({
    isLoading,
    routes,
  });

  const handleRouteClick = (route: ProbedRoute) => {
    setSelectedRoute(route);
  };

  const { data: allRequests } = useFetchRequestorRequests();
  console.log("allRequests", allRequests);
  const mostRecentMatchingResponse = allRequests
    ?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestUrl === getUrl(selectedRoute?.path) &&
        r?.app_requests?.requestMethod === selectedRoute?.method,
    )
    ?.reduce((latest: Requestornator, current: Requestornator) => {
      if (!latest) {
        return current;
      }
      if (latest.app_responses.updatedAt > current.app_responses.updatedAt) {
        return latest;
      }
      return current;
    }, undefined);

  const {
    body,
    setBody,
    requestHeaders,
    setRequestHeaders,
    queryParams,
    setQueryParams,
  } = useRequestorFormData();

  const requestorRequests = useMakeRequest();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedRoute) {
      requestorRequests.mutate({
        path: selectedRoute.path,
        method: selectedRoute.method,
        body: body ?? "", // FIXME
        headers: requestHeaders,
        queryParams,
      });
    }
  };

  return (
    <div className="flex h-full">
      <SideBar
        routes={routes}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
      />
      <div className="flex flex-col flex-1 ml-4">
        <RequestInput
          method={selectedRoute?.method}
          path={selectedRoute?.path}
          onSubmit={onSubmit}
        />
        <div className="flex flex-grow items-stretch mt-4 rounded overflow-hidden border">
          <RequestMeta
            setBody={setBody}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setQueryParams={setQueryParams}
            setRequestHeaders={setRequestHeaders}
          />
          <ResponseDetails response={mostRecentMatchingResponse} />
        </div>
      </div>
    </div>
  );
};

export default RequestorPage;

type SidebarProps = {
  routes?: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

function useResizableWidth(initialWidth: number, min = 200, max = 600) {
  const [width, setWidth] = useState(initialWidth);

  const getClampedWidth = useCallback(
    (newWidth: number) => {
      return Math.min(max, Math.max(newWidth, min));
    },
    [min, max],
  );

  const handleResize = useCallback(
    (_event: SyntheticEvent, { size }: ResizeCallbackData) => {
      setWidth(getClampedWidth(size.width));
    },
    [getClampedWidth],
  );

  return { width, handleResize };
}

function SideBar({ routes, selectedRoute, handleRouteClick }: SidebarProps) {
  const [showDetectedRoutes, setShowDetectedRoutes] = useState(true);
  const ShowDetectedIcon = showDetectedRoutes ? CaretDownIcon : CaretRightIcon;

  const { width, handleResize } = useResizableWidth(320);

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
      <div
        style={{ width: `${width}px` }}
        className={cn("flex flex-col px-4 overflow-x-hidden border-r")}
      >
        <h2 className="flex items-center rounded font-semibold">Endpoints</h2>
        <div className="flex-grow mt-4">
          <div className="">
            <div className="font-medium text-sm flex items-center mb-1">
              <ShowDetectedIcon
                className="h-4 w-4 mr-0.5 cursor-pointer"
                onClick={() => {
                  setShowDetectedRoutes((current) => !current);
                }}
              />
              Detected Routes
            </div>
            {showDetectedRoutes && (
              <div className="space-y-0">
                {routes?.map?.((route, index) => (
                  <div
                    key={index}
                    onClick={() => handleRouteClick(route)}
                    className={cn(
                      "flex items-center py-1 px-5 rounded cursor-pointer font-mono text-sm",
                      {
                        "bg-muted": selectedRoute === route,
                        "hover:bg-muted": selectedRoute !== route,
                      },
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        "min-w-12", // HACK - Magic number, will break of "OPTIONS", etc
                        getHttpMethodTextColor(route.method),
                      )}
                    >
                      {route.method}
                    </span>
                    <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {route.path}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto">{/* Settings? */}</div>
      </div>
    </Resizable>
  );
}

type RequestInputProps = {
  method?: string;
  path?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

function RequestInput({ method = "GET", path, onSubmit }: RequestInputProps) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const url = getUrl(path);
    setValue(url);
  }, [path]);

  return (
    <div className="">
      <form
        onSubmit={onSubmit}
        className="flex items-center justify-between rounded bg-muted border"
      >
        <div className="flex flex-grow items-center space-x-2">
          {/* <RequestMethodCombobox /> */}
          <span
            className={cn(
              "text-white min-w-12 px-4 py-1 rounded font-mono",
              getHttpMethodTextColor(method),
            )}
          >
            {method}
          </span>
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
          />
        </div>
        <div className="flex items-center space-x-2 p-2">
          <Button size="sm" type="submit">
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

type RequestMetaProps = {
  setBody: (body?: string) => void;
  queryParams: KeyValueParameter[];
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  requestHeaders: KeyValueParameter[];
};
function RequestMeta(props: RequestMetaProps) {
  const {
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
            <Editor
              height="400px"
              defaultLanguage="json"
              defaultValue="{}"
              onChange={(value) => setBody(value)}
              options={{
                minimap: { enabled: false, autohide: true },
                tabSize: 2,
                codeLens: false,
                scrollbar: { vertical: "auto", horizontal: "auto" },
                theme: "vs-light",
                padding: {
                  top: 0,
                  bottom: 0,
                },
                lineNumbersMinChars: 3,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Resizable>
  );
}

const NoResponse = () => (
  <div className="flex flex-col items-center justify-center p-4">
    <div className="text-gray-400">No response yet</div>
  </div>
);

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

function ResponseDetails({ response }: { response?: Requestornator }) {
  return (
    <div className="flex-grow flex flex-col items-stretch">
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
            <HeaderTable
              headers={response?.app_responses?.responseHeaders ?? {}}
            />
          </div>
        </TabsContent>
        <TabsContent value="fpx">COME BACK SOON HOMIE!</TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="flex-grow flex flex-col">
      <div className="flex items-center space-x-2 h-9 bg-muted px-2 py-1 border-b">
        <div className="text-sm font-medium">Response</div>
      </div>
    </div>
  );
}

function getHttpMethodTextColor(method: string) {
  return {
    GET: "text-green-500",
    POST: "text-yellow-500",
    PUT: "text-orange-500",
    PATCH: "text-orange-500",
    DELETE: "text-red-500",
    OPTIONS: "text-blue-300",
  }[method];
}

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {}

const ResizableHandle = forwardRef<HTMLDivElement, ResizableHandleProps>(
  (props, ref) => (
    <div
      ref={ref}
      className="w-[15px] h-full cursor-ew-resize top-0 right-[-8px] absolute z-10"
      {...props}
    />
  ),
);

function CustomTabTrigger(props: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      {...props}
      className={cn(
        "py-1",
        "px-0",
        "text-left",
        "h-9",
        "ml-2",
        "text-sm",
        "font-normal",
        "border-b",
        "border-transparent",
        "data-[state=active]:shadow-none",
        "data-[state=active]:bg-inherit",
        "data-[state=active]:rounded-none",
        "data-[state=active]:border-blue-500",
        props.className,
      )}
    />
  );
}
