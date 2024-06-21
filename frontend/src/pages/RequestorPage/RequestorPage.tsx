import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MizuTrace, useMizuTraces } from "@/queries";
import { cn, isJson } from "@/utils";
import { CountdownTimerIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyValueParameter } from "./KeyValueForm";
import { RequestPanel } from "./RequestPanel";
import { RequestorHistory } from "./RequestorHistory";
import { RequestorInput } from "./RequestorInput";
import { ResponseDetails, ResponseInstructions } from "./ResponseDetails";
import { RoutesPanel } from "./RoutesPanel";
import { TestingPersonaMenu, useAi } from "./ai";
import { useRequestorFormData } from "./data";
import {
  type ProbedRoute,
  Requestornator,
  useFetchRequestorRequests,
  useMakeRequest,
  useProbedRoutes,
} from "./queries";

export const RequestorPage = () => {
  const { data: traces } = useMizuTraces();

  const { routes, selectedRoute, handleRouteClick } = useRoutes();

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

  // HACK - Antipattern?
  //
  //        If the selected route changes,
  //        update our form data
  useEffect(() => {
    if (selectedRoute) {
      setPath(selectedRoute.path);
      setMethod(selectedRoute.method);
    }
  }, [selectedRoute, setMethod, setPath]);

  const { history, sessionHistory, recordRequestInSessionHistory } =
    useRequestorHistory();

  console.log("hi session history", sessionHistory);

  const mostRecentRequestornatorForRoute = useMostRecentRequestornator(
    { path, method, route: selectedRoute?.path },
    sessionHistory,
    // FIXME
    // @ts-expect-error - Types from useMizuTraces do not seem to match MizuTrace[]
    traces,
  );

  const { mutate: makeRequest, isLoading: isRequestorRequesting } =
    useMakeRequest();

  // Send a request when we submit the form
  const onSubmit = useRequestorSubmitHandler({
    body,
    path,
    method,
    queryParams,
    requestHeaders,
    makeRequest,
    recordRequestInSessionHistory,
    selectedRoute,
  });

  const {
    enabled: aiEnabled,
    isLoadingParameters,
    fillInRequest,
    testingPersona,
    setTestingPersona,
  } = useAi(selectedRoute, history, {
    setBody,
    setQueryParams,
    setPath,
  });

  return (
    <div
      className={cn(
        "flex flex-col space-y-4",
        "md:flex-row md:space-y-0",
        "h-full pt-4",
      )}
    >
      <RoutesPanel
        routes={routes}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
      />

      <div className="flex flex-col flex-1 md:ml-4">
        {aiEnabled && (
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
        )}

        <RequestorInput
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
            ) : mostRecentRequestornatorForRoute ? (
              <ResponseDetails response={mostRecentRequestornatorForRoute} />
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

function useRoutes() {
  const { data: routesAndMiddleware, isLoading, isError } = useProbedRoutes();
  const routes = useMemo(() => {
    return routesAndMiddleware?.filter((r) => r.handlerType === "route") ?? [];
  }, [routesAndMiddleware]);

  // Select the home route if it exists, otherwise fall back to the first route in the list
  const { selectedRoute, setSelectedRoute } = useAutoselectRoute({
    isLoading,
    routes,
  });

  const handleRouteClick = useCallback(
    (route: ProbedRoute) => {
      setSelectedRoute(route);
    },
    [setSelectedRoute],
  );

  return {
    isError,
    isLoading,
    routes,
    selectedRoute,
    handleRouteClick,
  };
}

function useRequestorHistory() {
  const { data: allRequests } = useFetchRequestorRequests();

  // Keep a history of recent requests and responses
  const history = useMemo<Array<Requestornator>>(() => {
    if (allRequests) {
      const cloned = [...allRequests];
      cloned.sort(sortRequestornatorsDescending);
      return cloned;
    }
    return [];
  }, [allRequests]);

  // Array of all requests made this session
  //
  // This is purposefully in memory so that we clear the response panel
  // when the user refreshes the page.
  //
  const [sessionHistoryTraceIds, setSessionHistoryTraceIds] = useState<
    Array<string>
  >([]);

  // We want to keep track of requests in history... however, I think this should be encapsulated with the
  // query logic itself (instead of something we need to remember to wire together with the `mutate` call)
  const recordRequestInSessionHistory = (traceId: string) =>
    setSessionHistoryTraceIds((current) => [traceId, ...current]);

  // HACK - We can load history entries this way! Just pass in a traceId for now, and then it shoooould appear in the UI
  //        Later we should match based off of request id or something more clever
  const loadHistoricalRequest = recordRequestInSessionHistory;

  // Keep a local history of requests that the user has made in the UI
  const sessionHistory = useMemo(() => {
    return sessionHistoryTraceIds.reduce(
      (matchedRequestornators, traceId) => {
        const match = history.find((r) => r.app_responses?.traceId === traceId);
        if (match) {
          matchedRequestornators.push(match);
        }
        return matchedRequestornators;
      },
      [] as Array<Requestornator>,
    );
  }, [history, sessionHistoryTraceIds]);

  return {
    history,
    sessionHistory,
    recordRequestInSessionHistory,
    loadHistoricalRequest,
  };
}

function useRequestorSubmitHandler({
  selectedRoute,
  body,
  path,
  method,
  queryParams,
  requestHeaders,
  makeRequest,
  recordRequestInSessionHistory,
}: {
  selectedRoute: ProbedRoute | null;
  body: string | undefined;
  path: string;
  method: string;
  queryParams: KeyValueParameter[];
  requestHeaders: KeyValueParameter[];
  makeRequest: ReturnType<typeof useMakeRequest>["mutate"];
  recordRequestInSessionHistory: (traceId: string) => void;
}) {
  return useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // FIXME - This blocks user from making requests when no routes have been detected
      if (!selectedRoute) {
        return;
      }

      // FIXME
      let cleverBody =
        typeof body === "string" && isJson(body)
          ? JSON.parse(body)
          : body ?? "";

      // HACK - Mizu API expects an object...
      if (cleverBody === "") {
        cleverBody = {};
      }

      makeRequest(
        {
          path,
          method,
          body: cleverBody,
          headers: requestHeaders,
          queryParams,
          route: selectedRoute.path,
        },
        {
          onSuccess(data) {
            // This is the response data i presume?
            console.log(
              "Made request... this is the response data I hope?",
              data,
            );
            const traceId = data?.traceId;
            if (traceId && typeof traceId === "string") {
              recordRequestInSessionHistory(traceId);
            }
          },
          onError(error) {
            // TODO - Show Toast
            console.error("Submit error!", error);
          },
        },
      );
    },
    [
      body,
      makeRequest,
      method,
      path,
      queryParams,
      recordRequestInSessionHistory,
      requestHeaders,
      selectedRoute,
    ],
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
        r?.app_requests?.requestRoute === requestInputs.route,
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
