import { z } from "zod";
import {
  KeyValueParameterSchema,
  enforceTerminalDraftParameter,
} from "../KeyValueForm";
import { ProbedRouteSchema } from "../queries";
import { RequestMethodSchema, RequestTypeSchema } from "../types";
import { loadUiStateFromLocalStorage } from "./persistence";
import { RequestorBodySchema } from "./request-body";
import { RequestsPanelTabSchema, ResponsePanelTabSchema } from "./tabs";

export const RequestorStateSchema = z.object({
  routes: z.array(ProbedRouteSchema).describe("All routes"),
  selectedRoute: ProbedRouteSchema.nullable().describe(
    "Indicates which route to highlight in the routes panel",
  ),

  // Request form
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
});

export type RequestorState = z.infer<typeof RequestorStateSchema>;

export type RequestorBody = RequestorState["body"];
export type RequestBodyType = RequestorBody["type"];

export const initialState: RequestorState = {
  routes: [],
  selectedRoute: null,
  path: "/",
  method: "GET",
  requestType: "http",

  pathParams: [],
  queryParams: enforceTerminalDraftParameter([]),
  requestHeaders: enforceTerminalDraftParameter([]),
  body: {
    type: "json",
    value: "",
  },

  websocketMessage: "",

  activeRequestsPanelTab: "params",
  visibleRequestsPanelTabs: ["params", "headers"],

  activeResponsePanelTab: "body",
  visibleResponsePanelTabs: ["body", "headers", "debug", "history"],

  // HACK - This is used to force us to show a response body for a request loaded from history
  activeHistoryResponseTraceId: null,
};

/**
 * Initializer for the reducer's state that attempts to load the UI state from local storage
 * If the UI state is not found, it returns the default initial state
 */
export const createInitialState = (initial: RequestorState) => {
  const savedState = loadUiStateFromLocalStorage();
  return savedState ? { ...initial, ...savedState } : initial;
};
