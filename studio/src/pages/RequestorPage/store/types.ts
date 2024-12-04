import { z } from "zod";
import { KeyValueParameterSchema } from "../KeyValueForm";
import {
  ProbedRouteSchema,
  RequestMethodSchema,
  RequestTypeSchema,
} from "../types";
import { RequestorBodySchema } from "./request-body";
import { RequestsPanelTabSchema, ResponsePanelTabSchema } from "./tabs";

const RequestorResponseBodySchema = z.discriminatedUnion("type", [
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

export type RequestorResponseBody = z.infer<typeof RequestorResponseBodySchema>;

const RequestorActiveResponseSchema = z.object({
  traceId: z.string().nullable(),
  responseBody: RequestorResponseBodySchema,
  responseHeaders: z.record(z.string()).nullable(),
  responseStatusCode: z.string(),
  isFailure: z.boolean(),

  requestUrl: z.string(),
  requestMethod: z.string(),
});

export const isRequestorActiveResponse = (
  response: unknown,
): response is RequestorActiveResponse => {
  return RequestorActiveResponseSchema.safeParse(response).success;
};

export type RequestorActiveResponse = z.infer<
  typeof RequestorActiveResponseSchema
>;

export const RequestorStateSchema = z.object({
  routes: z.array(ProbedRouteSchema).describe("All routes"),
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
  body: RequestorBodySchema.describe("Body"),
  pathParams: z
    .array(KeyValueParameterSchema)
    .describe("Path parameters and their corresponding values"),
  queryParams: z
    .array(KeyValueParameterSchema)
    .describe("Query parameters to be sent with the request"),
  requestHeaders: z
    .array(KeyValueParameterSchema)
    .describe("Headers to be sent with the request"),

  // Websocket messages form
  websocketMessage: z.string().describe("Websocket message"),

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

  // HACK - This is used to force us to show a response body for a request loaded from history
  activeHistoryResponseTraceId: z
    .string()
    .nullable()
    .describe("The trace id to show in the response panel"),

  // NOTE - This is used to force us to show a response body for a request that was most recently made
  activeResponse: RequestorActiveResponseSchema.nullable().describe(
    "The response to show in the response panel",
  ),
});

export type RequestorState = z.infer<typeof RequestorStateSchema>;

export type RequestorBody = RequestorState["body"];
export type RequestBodyType = RequestorBody["type"];
export type NavigationRoutesView = "list" | "fileTree";
