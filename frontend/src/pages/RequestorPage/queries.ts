import { PROBED_ROUTES_KEY, useMizuTraces } from "@/queries";
import { validate } from "@scalar/openapi-parser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { KeyValueParameter, reduceKeyValueParameters } from "./KeyValueForm";
import { RequestMethodSchema, RequestTypeSchema } from "./types";

export const ProbedRouteSchema = z.object({
  path: z.string(),
  method: RequestMethodSchema,
  handler: z.string(),
  handlerType: z.enum(["route", "middleware"]),
  currentlyRegistered: z.boolean(),
  routeOrigin: z.enum(["discovered", "custom", "open_api"]),
  openApiSpec: z.string().optional(),
  requestType: RequestTypeSchema,
  // NOTE - Added on the frontend, not stored in DB
  isDraft: z.boolean().optional(),
});

export type ProbedRoute = z.infer<typeof ProbedRouteSchema>;

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

// TODO - Use validation schema
export type Requestornator = {
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
    queryKey: [PROBED_ROUTES_KEY],
    queryFn: getProbedRoutes,
  });
}

export type Route = {
  path: string;
  method: string;
  handler?: string;
  handlerType?: "route" | "middleware";
  routeOrigin?: "discovered" | "custom" | "open_api";
  openApiSpec?: string;
  requestType?: "http" | "websocket";
  // NOTE - Added on the frontend, not stored in DB
  isDraft?: boolean;
};

async function addRoutes(routes: Route | Route[]) {
  return fetch("/v0/app-routes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(routes),
  }).then((r) => r.json());
}

export function useAddRoutes() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addRoutes,
    onSuccess: () => {
      // Invalidate and refetch app routes... not sure if this will mess with the currently selected route,
      // or if we want to autoselect the new route, or what
      queryClient.invalidateQueries({ queryKey: [PROBED_ROUTES_KEY] });
    },
  });

  return mutation;
}

function deleteRoute({
  path,
  method,
}: {
  path: string;
  method: string;
}) {
  return fetch(`/v0/app-routes/${method}/${encodeURIComponent(path)}`, {
    method: "DELETE",
  }).then((r) => r.json());
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROBED_ROUTES_KEY] });
    },
  });

  return mutation;
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

export function useOpenApiParse(openApiSpec: string) {
  const mutation = useMutation({
    mutationFn: async (openApiSpec: string) => {
      const { valid, schema } = await validate(openApiSpec);
      if (!valid) {
        throw new Error("Invalid OpenAPI spec");
      }
      return schema;
    },
    mutationKey: [openApiSpec],
  });
  return mutation;
}
