import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import Editor from "@monaco-editor/react"; // Import Monaco Editor
import {
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Resizable, ResizeCallbackData } from "react-resizable";
import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import "./MonacoEditorOverrides.css";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import {
  KeyValueForm,
  KeyValueParameter,
  createParameterId,
  useKeyValueForm,
} from "./KeyValueForm";

// import { RequestMethodCombobox } from "./RequestMethodCombobox";

type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
};

function getProbedRoutes(): Promise<ProbedRoute[]> {
  return fetch("/v0/app-routes").then((r) => r.json());
}

function makeRequest({
  path,
  method,
  body,
}: {
  path: string;
  method: string;
  body: string;
}) {
  return fetch("/v0/requestor-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      method,
      body,
    }),
  }).then((r) => r.json());
}

export const RequestorPage = () => {
  const { data: routes, isLoading } = useQuery({
    queryKey: ["appRoutes"],
    queryFn: getProbedRoutes,
  });

  const [selectedRoute, setSelectedRoute] = useState<ProbedRoute | null>(null);

  const handleRouteClick = (route: ProbedRoute) => {
    setSelectedRoute(route);
  };

  useEffect(() => {
    const shouldAutoselectRoute =
      !isLoading && routes?.length && selectedRoute === null;
    if (shouldAutoselectRoute) {
      const autoselectedRoute = routes.find((r) => r.path === "/") ?? routes[0];
      setSelectedRoute(autoselectedRoute);
    }
  }, [routes, isLoading, selectedRoute]);

  // TODO - Making a request
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: makeRequest,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["requestorRequests"] });
    },
  });

  // TODO - Fetch history of requestor requests
  //
  // const { data: requestorRequests } = useQuery({
  //   queryKey: ['requestorRequests'],
  //   queryFn: () => fetch("/v0/requestor-requests").then(r => r.json()),
  // })

  const [body, setBody] = useState<string | undefined>("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedRoute) {
      mutation.mutate({
        path: selectedRoute.path,
        method: selectedRoute.method,
        body: body ?? "", // FIXME
      });
    }
  };

  const {
    keyValueParameters: queryParams,
    setKeyValueParameters: setQueryParams,
  } = useKeyValueForm();

  const {
    keyValueParameters: requestHeaders,
    setKeyValueParameters: setRequestHeaders,
  } = useKeyValueForm();

  return (
    <div className="flex h-full">
      <SideBar
        routes={routes}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
      />
      <div className="flex-grow flex flex-col">
        <RequestInput
          method={selectedRoute?.method}
          path={selectedRoute?.path}
          onSubmit={onSubmit}
        />
        <div className="flex flex-grow">
          <RequestMeta
            setBody={setBody}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setQueryParams={setQueryParams}
            setRequestHeaders={setRequestHeaders}
          />
          <ResponseDetails />
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

  const { width, handleResize } = useResizableWidth(256);

  return (
    <Resizable
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
        className={cn(
          "bg-muted text-gray-700 flex flex-col px-4 rounded overflow-x-hidden",
        )}
      >
        <h2 className="flex items-center rounded font-semibold py-3 text-lg">
          Routes
        </h2>
        <div className="flex-grow mt-4">
          <div className="">
            <div className="font-medium text-sm h-9 flex items-center">
              <ShowDetectedIcon
                className="h-3.5 w-3.5 mr-1"
                onClick={() => {
                  setShowDetectedRoutes((current) => !current);
                }}
              />
              Detected Routes
            </div>
            {showDetectedRoutes && (
              <div className="space-y-0 px-3.5">
                {routes?.map?.((route, index) => (
                  <div
                    key={index}
                    onClick={() => handleRouteClick(route)}
                    className={cn(
                      "flex items-center p-1 rounded cursor-pointer font-mono text-sm",
                      {
                        "bg-gray-300": selectedRoute === route,
                        "hover:bg-gray-200": selectedRoute !== route,
                      },
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
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
    const url = `http://localhost:8787${path ?? ""}`;
    setValue(url);
  }, [path]);

  return (
    <div className="px-4">
      <form
        onSubmit={onSubmit}
        className="flex items-center justify-between rounded bg-muted"
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
          <Button size="sm" type="button">
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

  return (
    <div className="w-1/4 min-w-[350px] border-r-2 border-muted p-4">
      <Tabs defaultValue="params">
        <div className="flex items-center justify-start">
          <TabsList>
            <TabsTrigger value="params" className="text-sm font-medium">
              Params
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-sm font-medium">
              Headers
            </TabsTrigger>
            <TabsTrigger value="body" className="text-sm font-medium">
              Body
            </TabsTrigger>
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
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResponseDetails() {
  return (
    <div className="flex-grow flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-medium">Response</div>
      </div>
      <div className="flex-grow flex items-center justify-center text-gray-400">
        <span>🌀 Connection refused</span>
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
