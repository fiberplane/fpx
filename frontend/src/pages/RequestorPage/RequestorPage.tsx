import { Button } from "@/components/ui/button";
import { MizuTrace, useMizuTraces } from "@/queries";
import { cn, isJson, parsePathFromRequestUrl } from "@/utils";
import { MagicWandIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyValueParameter, createKeyValueParameters } from "./KeyValueForm";
import { RequestPanel } from "./RequestPanel";
import { RequestorInput } from "./RequestorInput";
import { ResponsePanel } from "./ResponsePanel";
import { RoutesCombobox } from "./RoutesCombobox";
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
  const { routes, selectedRoute, setSelectedRoute } = useRoutes();

  const {
    path,
    setPath,
    method,
    setMethod,
    body,
    setBody,
    pathParams,
    setPathParams,
    requestHeaders,
    setRequestHeaders,
    queryParams,
    setQueryParams,
    handleSelectRoute,
  } = useRequestorFormData(selectedRoute, setSelectedRoute);

  const {
    history,
    sessionHistory,
    recordRequestInSessionHistory,
    loadHistoricalRequest,
  } = useRequestorHistory({
    routes,
    handleSelectRoute,
    setPath,
    setPathParams,
    setBody,
    setQueryParams,
    setRequestHeaders,
  });

  const mostRecentRequestornatorForRoute = useMostRecentRequestornator(
    { path, method, route: selectedRoute?.path },
    sessionHistory,
  );

  const { mutate: makeRequest, isLoading: isRequestorRequesting } =
    useMakeRequest();

  // Send a request when we submit the form
  const onSubmit = useRequestorSubmitHandler({
    body,
    path,
    method,
    pathParams,
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
        "py-2",
        "space-y-4",
        "lg:grid lg:grid-cols-[auto_1fr] lg:space-y-0 lg:py-2 lg:gap-0",
        "h-[calc(100vh-64px)]",
      )}
    >
      <div
        className={cn(
          "max-h-full",
          "relative",
          "overflow-y-scroll",
          "lg:overflow-x-hidden",
        )}
      >
        <div className="lg:hidden">
          <RoutesCombobox
            routes={routes}
            selectedRoute={selectedRoute}
            handleRouteClick={handleSelectRoute}
          />
        </div>
        <RoutesPanel
          routes={routes}
          selectedRoute={selectedRoute}
          handleRouteClick={handleSelectRoute}
        />
      </div>

      <div
        className={cn(
          "flex flex-col flex-1 max-lg:h-full", // Extend container to bottom of screen
          "lg:ml-4 lg:col-auto",
          "max-h-full",
          "relative",
          "overflow-y-auto", // NOTE - This overflow-y-auto is what makes the entire container scrollable
          "lg:overflow-x-hidden",
        )}
      >
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

        <div
          className={cn(
            "flex",
            "flex-col",
            "flex-grow",
            "sm:grid",
            "sm:grid-cols-[auto_1fr]",
            "sm:flex-row",
            "items-stretch",
            "mt-4",
            "rounded-md",
            "overflow-scroll",
            "border",
            // HACK - This prevents overflow from getting too excessive.
            // FIXME - Need to resolve the problem with inner content expanding the parent
            "max-w-screen",
          )}
        >
          <RequestPanel
            body={body}
            setBody={setBody}
            pathParams={pathParams}
            queryParams={queryParams}
            requestHeaders={requestHeaders}
            setPath={setPath}
            currentRoute={selectedRoute?.path}
            setPathParams={setPathParams}
            setQueryParams={setQueryParams}
            setRequestHeaders={setRequestHeaders}
          />
          <div className="flex flex-col items-stretch flex-auto">
            <ResponsePanel
              response={mostRecentRequestornatorForRoute}
              isLoading={isRequestorRequesting}
              history={history}
              loadHistoricalRequest={loadHistoricalRequest}
            />
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

  return {
    isError,
    isLoading,
    routes,
    selectedRoute,
    setSelectedRoute,
  };
}

type RequestorHistoryHookArgs = {
  routes: ProbedRoute[];
  handleSelectRoute: (r: ProbedRoute, pathParams?: KeyValueParameter[]) => void;
  setPath: (path: string) => void;
  setBody: (body?: string) => void;
  setPathParams: (headers: KeyValueParameter[]) => void;
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
};

function useRequestorHistory({
  routes,
  handleSelectRoute,
  setPath,
  setPathParams,
  setRequestHeaders,
  setBody,
  setQueryParams,
}: RequestorHistoryHookArgs) {
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

  // This feels wrong... but it's a way to load a past request back into the UI
  const loadHistoricalRequest = (traceId: string) => {
    recordRequestInSessionHistory(traceId);
    const match = history.find((r) => r.app_responses?.traceId === traceId);
    if (match) {
      const method = match.app_requests.requestMethod;
      const routePattern = match.app_requests.requestRoute;
      const matchedRoute = routes.find(
        (r) => r.path === routePattern && r.method === method,
      );
      if (matchedRoute) {
        const pathParamsObject = match.app_requests.requestPathParams ?? {};
        const pathParams = createKeyValueParameters(
          Object.entries(pathParamsObject).map(([key, value]) => ({
            key,
            value,
          })),
        );

        // NOTE - Helps us set path parameters correctly
        handleSelectRoute(matchedRoute, pathParams);

        // Reset the path to the *exact* path of the request, instead of the route pattern
        const path =
          parsePathFromRequestUrl(match.app_requests.requestUrl) ?? "";
        setPath(path);

        const headers = match.app_requests.requestHeaders ?? {};
        setRequestHeaders(
          createKeyValueParameters(
            Object.entries(headers).map(([key, value]) => ({ key, value })),
          ),
        );

        const queryParams = match.app_requests.requestQueryParams ?? {};
        setQueryParams(
          createKeyValueParameters(
            Object.entries(queryParams).map(([key, value]) => ({
              key,
              value,
            })),
          ),
        );

        // NOTE - We set the body to be a string for now, since that helps us render it in the UI
        const body = match.app_requests.requestBody;
        const safeBody =
          body && typeof body !== "string" ? JSON.stringify(body) : body;
        setBody(safeBody ?? undefined);
      }
    }
  };

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
  pathParams,
  queryParams,
  requestHeaders,
  makeRequest,
  recordRequestInSessionHistory,
}: {
  selectedRoute: ProbedRoute | null;
  body: string | undefined;
  path: string;
  method: string;
  pathParams: KeyValueParameter[];
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
          pathParams,
          queryParams,
          route: selectedRoute.path,
        },
        {
          onSuccess(data) {
            const traceId = data?.traceId;
            if (traceId && typeof traceId === "string") {
              recordRequestInSessionHistory(traceId);
            } else {
              console.error(
                "RequestorPage: onSuccess: traceId is not a string",
                data,
              );
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
      pathParams,
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
) {
  return useMemo<Requestornator | undefined>(() => {
    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestRoute === requestInputs.route,
    );

    // Descending sort by updatedAt
    matchingResponses?.sort(sortRequestornatorsDescending);

    return matchingResponses?.[0];
  }, [all, requestInputs]);
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
