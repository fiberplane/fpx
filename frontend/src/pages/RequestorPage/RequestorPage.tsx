import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { Resizable } from "react-resizable";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { RequestPanel } from "./RequestPanel";
import { ResizableHandle } from "./Resizable";
import { ResponseDetails, ResponseInstructions } from "./ResponseDetails";
import { useRequestorFormData } from "./data";
import { useResizableWidth } from "./hooks";
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

function useMostRecentRequestornator(
  selectedRoute: ProbedRoute | null,
  all: Requestornator[],
) {
  return useMemo<Requestornator | undefined>(() => {
    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestUrl === getUrl(selectedRoute?.path) &&
        r?.app_requests?.requestMethod === selectedRoute?.method,
    );

    // Descending sort by updatedAt
    matchingResponses?.sort((a, b) => {
      if (a.app_responses.updatedAt > b.app_responses.updatedAt) {
        return -1;
      }
      if (a.app_responses.updatedAt < b.app_responses.updatedAt) {
        return 1;
      }
      return 0;
    });

    return matchingResponses?.[0];
  }, [all, selectedRoute]);
}

export const RequestorPage = () => {
  const { data: routesAndMiddleware, isLoading } = useProbedRoutes();

  // NOTE - Response includes middleware, so filter for only routes
  const routes = useMemo(() => {
    return routesAndMiddleware?.filter((r) => r.handlerType === "route") ?? [];
  }, [routesAndMiddleware]);

  // Select the home route if it exists, otherwise fall back to the first route in the list
  const { selectedRoute, setSelectedRoute } = useAutoselectRoute({
    isLoading,
    routes,
  });

  const handleRouteClick = (route: ProbedRoute) => {
    setSelectedRoute(route);
  };

  const { data: allRequests } = useFetchRequestorRequests();
  const mostRecentMatchingResponse = useMostRecentRequestornator(
    selectedRoute,
    allRequests,
  );

  const {
    body,
    setBody,
    requestHeaders,
    setRequestHeaders,
    queryParams,
    setQueryParams,
  } = useRequestorFormData();

  const requestorRequestMaker = useMakeRequest();

  // Send a request when we submit the form
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoute) {
      return;
    }
    requestorRequestMaker.mutate({
      path: selectedRoute.path,
      method: selectedRoute.method,
      body: body ?? "", // FIXME
      headers: requestHeaders,
      queryParams,
    });
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
          <RequestPanel
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
