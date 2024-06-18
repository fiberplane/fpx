import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isJson } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { RequestPanel } from "./RequestPanel";
import { ResponseDetails, ResponseInstructions } from "./ResponseDetails";
import { RoutesPanel } from "./RoutesPanel";
import { useRequestorFormData } from "./data";
import {
  type ProbedRoute,
  Requestornator,
  getUrl,
  useFetchRequestorRequests,
  useMakeRequest,
  useProbedRoutes,
  useGenerateRequest,
} from "./queries";
import { MagicWandIcon } from "@radix-ui/react-icons";
import { createKeyValueParameters } from "./KeyValueForm";

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
    // FIXME
    let cleverBody =
      typeof body === "string" && isJson(body) ? JSON.parse(body) : body ?? "";

    // HACK - Mizu API expects an object...
    if (cleverBody === "") {
      cleverBody = {};
    }
    requestorRequestMaker.mutate({
      path: selectedRoute.path,
      method: selectedRoute.method,
      body: cleverBody,
      headers: requestHeaders,
      queryParams,
    });
  };

  // TODO 
  // /v0/generate-request
  const { data: generatedRequest, refetch: generateRequest } = useGenerateRequest(selectedRoute?.handler);

  const fillInRequest = () => {
    generateRequest().then(({ data, isError }) => {
      if (isError) {
        console.error(data);
        return;
      }

      const body = data.request?.body;
      const queryParams = data.request?.queryParams;
      if (body) {
        setBody(body);
      }
      if (queryParams) {
        // TODO - Tighten up types, this could wreak havoc
        const newParameters = createKeyValueParameters(queryParams);
        setQueryParams(newParameters);
      }
    })
  }

  return (
    <div className="flex h-full">
      <RoutesPanel
        routes={routes}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
      />
      <div className="flex flex-col flex-1 ml-4">
        <div className="mb-2 flex items-center justify-end">
          <Button variant="ghost" size="sm" onClick={fillInRequest}>
            <MagicWandIcon className="w-4 h-4" />
          </Button>
        </div>
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
