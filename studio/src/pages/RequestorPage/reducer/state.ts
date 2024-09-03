import { z } from "zod";
import {
  KeyValueParameterSchema,
  enforceTerminalDraftParameter,
} from "../KeyValueForm";
import {
  ProbedRouteSchema,
  RequestMethodSchema,
  RequestTypeSchema,
} from "../types";
// import { updateContentTypeHeader } from "./reducers";
// import { addContentTypeHeader } from "./reducers";
import { RequestorBodySchema } from "./request-body";
import { isCurrentSessionState } from "./session-persistence-key";
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
  selectedRoute: ProbedRouteSchema.nullable().describe(
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

// export type RequestorState = {
//   /** All routes */
//   routes: ProbedRoute[];
//   /** Indicates which route to highlight in the routes panel */
//   selectedRoute: ProbedRoute | null;

//   // Request form
//   /** Base URL for requests */
//   serviceBaseUrl: string;
//   /** Path input */
//   path: string;
//   /** Method input */
//   RequestMethod;
//   /** Request type input */
//   RequestType;
//   /** Body */
//   body: RequestorBody;
//   /** Path parameters and their corresponding values */
//   pathParams: KeyValueParameter[];
//   /** Query parameters to be sent with the request */
//   queryParams: KeyValueParameter[];
//   /** Headers to be sent with the request */
//   requestHeaders: KeyValueParameter[];

//   // Websocket messages form
//   /** Websocket message */
//   websocketMessage: string;

//   // Tabs
//   /** The tab to show in the requests panel */
//   activeRequestsPanelTab: RequestsPanelTab;
//   /** The tabs to show in the requests panel */
//   visibleRequestsPanelTabs: RequestsPanelTab[];

//   /** The tab to show in the response panel */
//   activeResponsePanelTab: ResponsePanelTab;
//   /** The tabs to show in the response panel */
//   visibleResponsePanelTabs: ResponsePanelTab[];

//   /** The trace id to show in the response panel */
//   activeHistoryResponseTraceId: string | null;

//   /** The response to show in the response panel */
//   activeResponse: RequestorActiveResponse | null;
// };

export type RequestorState = z.infer<typeof RequestorStateSchema>;

export type RequestorBody = RequestorState["body"];
export type RequestBodyType = RequestorBody["type"];

export const initialState: RequestorState = {
  routes: [],
  selectedRoute: null,
  path: "/",
  serviceBaseUrl: "http://localhost:8787",
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

  activeResponsePanelTab: "response",
  visibleResponsePanelTabs: ["response", "debug"],

  // HACK - This is used to force us to show a response body for a request loaded from history
  activeHistoryResponseTraceId: null,

  activeResponse: null,
};

// updateContentTypeHeader(initialState);

/**
 * Initializer for the reducer's state that attempts to load the UI state from local storage
 * If the UI state is not found, it returns the default initial state
 */
export const createInitialState = (initial: RequestorState) => {
  const savedState = loadUiStateFromLocalStorage();
  return savedState ? { ...initial, ...savedState } : initial;
};

/**
 * A subset of the RequestorState that is saved to local storage.
 * We don't save things like `routes` since that could be crufty,
 * and will be refetched when the page reloads anyhow
 */
export const SavedRequestorStateSchema = RequestorStateSchema.pick({
  path: true,
  method: true,
  requestType: true,
  pathParams: true,
  queryParams: true,
  requestHeaders: true,
  body: true,
  activeRequestsPanelTab: true,
  visibleRequestsPanelTabs: true,
  activeResponsePanelTab: true,
  visibleResponsePanelTabs: true,
});

export type SavedRequestorState = z.infer<typeof SavedRequestorStateSchema>;

const isSavedRequestorState = (
  state: unknown,
): state is SavedRequestorState => {
  const result = SavedRequestorStateSchema.safeParse(state);
  if (!result.success) {
    console.error(
      "SavedRequestorState validation failed:",
      result.error.format(),
    );
  }
  return result.success;
};

export const LOCAL_STORAGE_KEY = "requestorUiState";

function loadUiStateFromLocalStorage(): SavedRequestorState | null {
  const possibleUiState = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!possibleUiState) {
    return null;
  }

  try {
    const uiState = JSON.parse(possibleUiState);
    if (isSavedRequestorState(uiState) && isCurrentSessionState(uiState)) {
      return uiState;
    }
    return null;
  } catch {
    return null;
  }
}
