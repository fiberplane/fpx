import { useMizuTraces } from "@/queries";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { KeyValueParameter, reduceKeyValueParameters } from "./KeyValueForm";

export type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
  handlerType: "route" | "middleware";
  currentlyRegistered: boolean;
};

export type Requestornator = {
  // TODO
  app_requests: {
    id: number;
    requestUrl: string;
    requestMethod: string;
    requestRoute: string;
    updatedAt: string;
  };
  // NOTE - can be undefined if request failed, at least that happened to me locally
  app_responses: {
    id: number;
    responseStatusCode: string;
    responseBody: string;
    responseHeaders: Record<string, string>;
    traceId: string;
    updatedAt: string;
  };
};

const REQUESTOR_REQUESTS_KEY = "requestorRequests";

export function getUrl(path?: string) {
  return `http://localhost:8787${path ?? ""}`;
}

function getProbedRoutes(): Promise<ProbedRoute[]> {
  return fetch("/v0/app-routes").then((r) => r.json());
}

export function useProbedRoutes() {
  return useQuery({
    queryKey: ["appRoutes"],
    queryFn: getProbedRoutes,
  });
}

export function useFetchRequestorRequests() {
  return useQuery({
    queryKey: [REQUESTOR_REQUESTS_KEY],
    queryFn: () => fetch("/v0/all-requests").then((r) => r.json()),
  });
}

export function useMakeRequest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: makeRequest,
    onSuccess: () => {
      // Invalidate and refetch requestor requests
      queryClient.invalidateQueries({ queryKey: [REQUESTOR_REQUESTS_KEY] });
    },
  });

  return mutation;
}

export function makeRequest({
  path,
  method,
  body,
  headers,
  queryParams,
  route,
}: {
  path: string;
  method: string;
  body?: string;
  headers: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  route?: string;
}) {
  return fetch("/v0/send-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestUrl: getUrl(path),
      requestMethod: method,
      requestBody: method === "GET" ? undefined : body,
      requestHeaders: reduceKeyValueParameters(headers),
      requestQueryParams: reduceKeyValueParameters(queryParams),
      requestRoute: route,
    }),
  }).then((r) => r.json());
}

export function useTrace(traceId: string) {
  const { data: traces, isLoading, error } = useMizuTraces();
  const trace = traces?.find((t) => t.id === traceId);
  const isNotFound = !trace && !error && !isLoading;
  return {
    trace,
    isNotFound,
    isLoading,
    error,
  };
}
