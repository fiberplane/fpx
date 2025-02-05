import { z } from "zod";
import {
  ProbedRouteSchema,
  RequestMethodSchema,
  RequestTypeSchema,
} from "../types";
import { PlaygroundBodySchema } from "./request-body";
import { RequestsPanelTabSchema, ResponsePanelTabSchema } from "./tabs";

const PlaygroundResponseBodySchema = z.discriminatedUnion("type", [
  z.object({
    contentType: z.string(),
    type: z.literal("empty"),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("json"),
    // NOTE - we pass it as text
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("text"),
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("html"),
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("binary"),
    value: z.instanceof(ArrayBuffer),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("unknown"),
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("error"),
    value: z.null(),
  }),
]);

export type PlaygroundResponseBody = z.infer<
  typeof PlaygroundResponseBodySchema
>;

const PlaygroundActiveResponseSchema = z.object({
  traceId: z.string().nullable(),
  responseBody: PlaygroundResponseBodySchema,
  responseHeaders: z.record(z.string()).nullable(),
  responseStatusCode: z.string(),
  isFailure: z.boolean(),

  requestUrl: z.string(),
  requestMethod: z.string(),
});

export const isPlaygroundActiveResponse = (
  response: unknown,
): response is PlaygroundActiveResponse => {
  return PlaygroundActiveResponseSchema.safeParse(response).success;
};

export type PlaygroundActiveResponse = z.infer<
  typeof PlaygroundActiveResponseSchema
>;

export const KeyValueParameterSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

/**
 * A "key-value parameter" is a record containing `key` and `value` properties.
 * It can be used to represent things like query parameters or headers.
 */
export type KeyValueParameter = z.infer<typeof KeyValueParameterSchema>;

export const PlaygroundStateSchema = z.object({
  appRoutes: z.array(ProbedRouteSchema).describe("All routes"),
  routesAndMiddleware: z
    .array(ProbedRouteSchema)
    .describe("All routes and middleware"),
  activeRoute: ProbedRouteSchema.nullable().describe(
    "Indicates which route to highlight in the routes panel",
  ),

  // Request form
  serviceBaseUrl: z.string().describe("Base URL for requests"),
  path: z.string().describe("Path input"),
  method: RequestMethodSchema.describe("Method input"),
  requestType: RequestTypeSchema.describe("Request type input"),
  requestParameters: z.record(
    z.string(),
    z.object({
      body: PlaygroundBodySchema.describe("Body"),
      pathParams: z
        .array(KeyValueParameterSchema)
        .describe("Path parameters and their corresponding values"),
      queryParams: z
        .array(KeyValueParameterSchema)
        .describe("Query parameters to be sent with the request"),
      requestHeaders: z
        .array(KeyValueParameterSchema)
        .describe("Headers to be sent with the request"),
    }),
  ),

  // Tabs
  activeRequestsPanelTab: RequestsPanelTabSchema.describe(
    "The tab to show in the requests panel",
  ),
  visibleRequestsPanelTabs: z
    .array(RequestsPanelTabSchema)
    .describe("The tabs to show in the requests panel"),

  activeResponsePanelTab: ResponsePanelTabSchema.describe(
    "The tab to show in the response panel",
  ),
  visibleResponsePanelTabs: z
    .array(ResponsePanelTabSchema)
    .describe("The tabs to show in the response panel"),

  // NOTE - This is used to force us to show a response body for a request that was most recently made
  activeResponse: PlaygroundActiveResponseSchema.nullable().describe(
    "The response to show in the response panel",
  ),
});

export type PlaygroundState = z.infer<typeof PlaygroundStateSchema>;

export type PlaygroundBody = z.infer<typeof PlaygroundBodySchema>;
export type NavigationRoutesView = "list" | "fileTree";
