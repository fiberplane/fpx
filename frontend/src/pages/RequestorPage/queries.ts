import { PROBED_ROUTES_KEY } from "@/queries";
import { validate } from "@scalar/openapi-parser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { reduceFormDataParameters } from "./FormDataForm";
import { KeyValueParameter, reduceKeyValueParameters } from "./KeyValueForm";
import type { RequestorBody } from "./reducer/state";
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

export type MakeProxiedRequestQueryFn = ReturnType<
  typeof useMakeProxiedRequest
>["mutate"];

export function useMakeProxiedRequest({
  clearResponseBodyFromHistory,
}: { clearResponseBodyFromHistory: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: makeProxiedRequest,
    onSuccess: () => {
      // Invalidate and refetch requestor requests
      queryClient.invalidateQueries({ queryKey: [REQUESTOR_REQUESTS_KEY] });
      clearResponseBodyFromHistory();
    },
    onError: () => {
      clearResponseBodyFromHistory();
    },
  });

  return mutation;
}

export function makeProxiedRequest({
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
  body: RequestorBody;
  headers: KeyValueParameter[];
  pathParams?: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  route?: string;
}) {
  const queryParamsForUrl = new URLSearchParams();
  queryParams.forEach((param) => {
    if (param.enabled) {
      queryParamsForUrl.set(param.key, param.value);
    }
  });

  // NOTE - we add custom headers to record additional metadata about the request
  const modHeaders = reduceKeyValueParameters(headers);
  if (route) {
    modHeaders["x-fpx-route"] = route;
  }
  // HACK - Serialize path params into a header
  //        This could cause encoding issues if there are funky chars in the path params
  modHeaders["x-fpx-path-params"] = JSON.stringify(
    reduceKeyValueParameters(pathParams ?? []),
  );

  // HACK - This is the most secure code I've ever written
  modHeaders["x-fpx-proxy-to"] = addBaseUrl(path);

  // We resolve the url with query parameters
  const searchString = queryParamsForUrl.toString();
  const resolvedPath = searchString ? `${path}?${searchString}` : path;

  // We create the body
  // FIXME - We should validate JSON in the UI itself
  const hackyBody = createBody(body);

  return fetch(`/v0/proxy-request${resolvedPath}`, {
    method,
    headers: modHeaders,
    body: method === "GET" || method === "HEAD" ? undefined : hackyBody,
  }).then((r) => {
    console.log("i got a response hereeeee", r);
    // TODO - If there's a file response... use it? Idk
    return {
      traceId: r.headers.get("x-fpx-trace-id"),
    };
  });
}

function createBody(body: RequestorBody) {
  if (body.type === "json") {
    if (typeof body.value !== "undefined") {
      return body.value;
    }
    return undefined;
  }
  // NOTE - We automatically send multipart when there's a file
  if (body.type === "form-data") {
    const isMultipart = !!body.isMultipart;
    // FIXME - Remove this eventually and provide a dialogue in the ui when someone adds a non-text file to a urlencoded form (a la httpie)
    const hasFile = body.value.some((item) => item.value.type === "file");
    if (isMultipart || hasFile) {
      return reduceFormDataParameters(body.value);
    }
    return createUrlEncodedBody(
      reduceKeyValueParameters(
        body.value.map((item) => ({
          id: item.id,
          enabled: item.enabled,
          key: item.key,
          // HACK - We know these are all non-strings because of the `hasFile` case above
          value: item.value.value as string,
        })),
      ),
    );
  }

  return body.value;
}

// NOTE - This is for urlencoded (not multipart)
function createUrlEncodedBody(body: Record<string, string>) {
  return new URLSearchParams(body).toString();
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
