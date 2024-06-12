import { useMutation, useQuery, useQueryClient } from "react-query";
import { KeyValueParameter, reduceKeyValueParameters } from "./KeyValueForm";

export type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
};

export type Requestornator = {
  // todo
  app_requests: {
    requestUrl: string;
    requestMethod: string;
  };
  app_responses: {
    responseStatusCode: string;
    responseBody: string;
    responseHeaders: Record<string, string>;
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
}: {
  path: string;
  method: string;
  body: string;
  headers: KeyValueParameter[];
  queryParams: KeyValueParameter[];
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
    }),
  }).then((r) => r.json());
}
