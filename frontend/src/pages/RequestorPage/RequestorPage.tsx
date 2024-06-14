import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import {
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Resizable, ResizeCallbackData } from "react-resizable";

import { MonacoJsonEditor } from "./Editors";
import { CodeMirrorJsonEditor } from "./Editors";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { ResponseDetails, ResponseInstructions } from "./ResponseDetails";
import { CustomTabTrigger } from "./Tabs";
import { useRequestorFormData } from "./data";
import { getHttpMethodTextColor } from "./method";
import {
  type ProbedRoute,
  Requestornator,
  getUrl,
  useFetchRequestorRequests,
  useMakeRequest,
  useProbedRoutes,
} from "./queries";

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
  const { data: routesAndMiddleware, isLoading } = useProbedRoutes();

  const routes = useMemo(() => {
    return routesAndMiddleware?.filter((r) => r.handlerType === "route") ?? [];
  }, [routesAndMiddleware]);

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
            body={body}
            setBody={setBody}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setQueryParams={setQueryParams}
            setRequestHeaders={setRequestHeaders}
          />
          <div className="flex-grow flex flex-col items-stretch">
            {mostRecentMatchingResponse ? (
              <ResponseDetails response={mostRecentMatchingResponse} />
            ) : (
              <ResponseInstructions />
            )}
          </div>
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
                        "min-w-12",
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
        <div className="flex flex-grow items-center space-x-0">
          <RequestMethodCombobox method={method} />
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
  body?: string;
  setBody: (body?: string) => void;
  queryParams: KeyValueParameter[];
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  requestHeaders: KeyValueParameter[];
};
function RequestMeta(props: RequestMetaProps) {
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
