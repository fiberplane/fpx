import { useMizuTraces } from "@/queries";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { z } from "zod";
import { KeyValueParameter, reduceKeyValueParameters } from "./KeyValueForm";

export type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
  handlerType: "route" | "middleware";
  currentlyRegistered: boolean;
  // TODO - Implement
  isDraft?: boolean;
};

const JsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(JsonSchema),
  ]),
);

type JsonSchemaType = z.infer<typeof JsonSchema>;

export type Requestornator = {
  // TODO
  app_requests: {
    id: number;
    requestUrl: string;
    requestMethod: string;
    requestRoute: string;
    requestHeaders?: Record<string, string> | null;
    requestQueryParams?: Record<string, string> | null;
    requestPathParams?: Record<string, string> | null;
    requestBody?: JsonSchemaType;
    updatedAt: string;
  };
  // NOTE - can be undefined if request failed, at least that happened to me locally
  app_responses: {
    id: number;
    responseStatusCode: string;
    responseBody: string;
    responseHeaders: Record<string, string>;
    traceId: string;
    isFailure: boolean;
    failureReason: string | null;
    updatedAt: string;
  };
};

const REQUESTOR_REQUESTS_KEY = "requestorRequests";

type ProbedRoutesResponse = {
  baseUrl: string;
  routes: ProbedRoute[];
};

function getProbedRoutes(): Promise<ProbedRoutesResponse> {
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
  addBaseUrl,
  path,
  method,
  body,
  headers,
  pathParams,
  queryParams,
  route,
}: {
  addBaseUrl: (path: string) => string;
  path: string;
  method: string;
  body?: string;
  headers: KeyValueParameter[];
  pathParams?: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  route?: string;
}) {
  return fetch("/v0/send-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestUrl: addBaseUrl(path),
      requestMethod: method,
      // NOTE - GET / HEAD requests cannot have a body
      requestBody: method === "GET" || method === "HEAD" ? undefined : body,
      requestHeaders: reduceKeyValueParameters(headers),
      requestPathParams: reduceKeyValueParameters(pathParams ?? []),
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
