import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MizuTrace, useMizuTraces } from "@/queries";
import { isJson } from "@/utils";
import { CountdownTimerIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { createKeyValueParameters } from "./KeyValueForm";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { RequestPanel } from "./RequestPanel";
import { RequestorHistory } from "./RequestorHistory";
import { ResponseDetails, ResponseInstructions } from "./ResponseDetails";
import { RoutesPanel } from "./RoutesPanel";
import { TestingPersonaMenu } from "./TestingPersonaMenu";
import { useRequestorFormData } from "./data";
import {
  type ProbedRoute,
  Requestornator,
  getUrl,
  useFetchRequestorRequests,
  useGenerateRequest,
  useMakeRequest,
  useProbedRoutes,
} from "./queries";

export const RequestorPage = () => {
  const { data: routesAndMiddleware, isLoading } = useProbedRoutes();
  const { data: traces } = useMizuTraces();

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

  const {
    path,
    setPath,
    method,
    setMethod,
    body,
    setBody,
    requestHeaders,
    setRequestHeaders,
    queryParams,
    setQueryParams,
  } = useRequestorFormData();
  const [testingPersona, setTestingPersona] = useState<string>("Friendly");

  // HACK - Antipattern
  useEffect(() => {
    if (selectedRoute) {
      setPath(selectedRoute.path);
      setMethod(selectedRoute.method);
    }
  }, [selectedRoute, setMethod, setPath]);

  const { data: allRequests } = useFetchRequestorRequests();
  const mostRecentMatchingResponse = useMostRecentRequestornator(
    { path, method, route: selectedRoute?.path },
    allRequests,
    // @ts-expect-error - Types from useMizuTraces do not seem to match MizuTrace[]
    traces,
  );

  // Keep a history of recent requests and responses
  const history = useMemo<Array<Requestornator>>(() => {
    if (allRequests) {
      const cloned = [...allRequests];
      cloned.sort(sortRequestornatorsDescending);
      return cloned;
    }
    return [];
  }, [allRequests]);

  const recentHistory = useMemo(() => {
    return history.slice(0, 5);
  }, [history]);

  const {
    // data: returnedRequest,
    mutate: makeRequest,
    isLoading: isRequestorRequesting,
  } = useMakeRequest();

  // Send a request when we submit the form
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoute) {
      return;
    }
    // FIXME
    let cleverBody =
      typeof body === "string" && isJson(body) ? JSON.parse(body) : body ?? "";

    // HACK - Mizu API expects an object...
    if (cleverBody === "") {
      cleverBody = {};
    }
    makeRequest({
      path,
      method,
      body: cleverBody,
      headers: requestHeaders,
      queryParams,
    });
  };

  // TODO
  // /v0/generate-request
  const { isLoading: isLoadingParameters, refetch: generateRequest } =
    useGenerateRequest(selectedRoute, recentHistory, testingPersona);

  const fillInRequest = () => {
    generateRequest().then(({ data, isError }) => {
      if (isError) {
        console.error(data);
        return;
      }

      const body = data.request?.body;
      const queryParams = data.request?.queryParams;
      const path = data.request?.path;
      if (body) {
        setBody(body);
      }
      if (queryParams) {
        // TODO - Tighten up types, this could wreak havoc
        const newParameters = createKeyValueParameters(queryParams);
        setQueryParams(newParameters);
      }
      if (path) {
        setPath(path);
      }
    });
  };

  return (
    <div className="flex h-full">
      <RoutesPanel
        routes={routes}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
      />
      <div className="flex flex-col flex-1 ml-4">
        <div className="mb-2 flex items-center justify-start space-x-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={fillInRequest}
            disabled={isLoadingParameters}
          >
            <MagicWandIcon className="w-4 h-4" />
          </Button>
          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="sm">
                <CountdownTimerIcon className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[600px]">
              <SheetHeader>
                <SheetTitle>History</SheetTitle>
                <SheetDescription>
                  View the history of recent requests.
                </SheetDescription>
              </SheetHeader>
              <RequestorHistory history={history} />
            </SheetContent>
          </Sheet>
          <TestingPersonaMenu
            persona={testingPersona}
            onPersonaChange={setTestingPersona}
          />
        </div>
        <RequestInput
          method={method}
          setMethod={setMethod}
          path={path}
          setPath={setPath}
          onSubmit={onSubmit}
          isRequestorRequesting={isRequestorRequesting}
        />
        <div className="flex flex-grow items-stretch mt-4 rounded overflow-hidden border max-w-screen">
          <RequestPanel
            body={body}
            setBody={setBody}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setQueryParams={setQueryParams}
            setRequestHeaders={setRequestHeaders}
          />
          <div className="flex-grow flex flex-col items-stretch">
            {isRequestorRequesting ? (
              <div>Loading...</div>
            ) : mostRecentMatchingResponse ? (
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

type RequestInputProps = {
  method: string;
  setMethod: (method: string) => void;
  path?: string;
  setPath: (path: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isRequestorRequesting?: boolean;
};

function RequestInput({
  method,
  setMethod,
  path,
  setPath,
  onSubmit,
  isRequestorRequesting,
}: RequestInputProps) {
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
          <RequestMethodCombobox method={method} setMethod={setMethod} />
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              try {
                const url = new URL(e.target.value);
                setPath(url.pathname);
              } catch {
                // TODO - Error state
                console.error("Invalid URL", e.target.value);
              }
            }}
            className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
          />
        </div>
        <div className="flex items-center space-x-2 p-2">
          <Button size="sm" type="submit" disabled={isRequestorRequesting}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

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

/**
 * When you select a route from the route side panel,
 * this will look for the most recent request made against that route.
 */
function useMostRecentRequestornator(
  requestInputs: { path: string; method: string; route?: string },
  all: Requestornator[],
  traces: MizuTrace[],
) {
  return useMemo<Requestornator | undefined>(() => {
    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestUrl === getUrl(requestInputs?.path) &&
        r?.app_requests?.requestMethod === requestInputs?.method,
    );

    // HACK - When the route parameters are modified in the url input, we no longer can match the request to a response
    //        e.g., for `/bugs/:id`, we cannot find requests to `/bugs/123`
    //        This logic looks for traces that have a route pattern that's the same as what has been selected from the side bar,
    //        then sees if those traces have any corresponding responses.
    //        It's very convoluted... and smelly
    const matchingTraces = traces?.filter(
      (t) =>
        t.route === requestInputs.route && t.method === requestInputs.method,
    );
    const matchingTraceIds = matchingTraces?.map((t) => t.id);
    for (const matchingTraceId of matchingTraceIds ?? []) {
      const responseForTrace = all?.find(
        (r: Requestornator) => r?.app_responses?.traceId === matchingTraceId,
      );
      if (responseForTrace && !matchingResponses?.includes(responseForTrace)) {
        matchingResponses?.push(responseForTrace);
      }
    }

    // Descending sort by updatedAt
    matchingResponses?.sort(sortRequestornatorsDescending);

    return matchingResponses?.[0];
  }, [all, requestInputs, traces]);
}

function sortRequestornatorsDescending(a: Requestornator, b: Requestornator) {
  const aLatestTimestamp =
    a.app_responses?.updatedAt ?? a.app_requests?.updatedAt;
  const bLatestTimestamp =
    b.app_responses?.updatedAt ?? b.app_requests?.updatedAt;
  if (aLatestTimestamp > bLatestTimestamp) {
    return -1;
  }
  if (aLatestTimestamp < bLatestTimestamp) {
    return 1;
  }
  return 0;
}
