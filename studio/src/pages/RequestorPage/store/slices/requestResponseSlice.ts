import type { StateCreator } from "zustand";
import { enforceFormDataTerminalDraftParameter } from "../../FormDataForm";
import type { KeyValueParameter } from "../../KeyValueForm";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import {
  addBaseUrl,
  extractMatchedPathParams,
  extractPathParams,
  mapPathParamKey,
  removeBaseUrl,
} from "../../reducer/reducer";
import {
  setBodyTypeReducer,
  updateContentTypeHeader,
} from "../../reducer/reducers";
import { findMatchedRoute } from "../../routes";
import type { RequestResponseSlice, Store } from "./types";

export const requestResponseSlice: StateCreator<
  Store,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  RequestResponseSlice
> = (set, get) => ({
  serviceBaseUrl: "http://localhost:8787",
  path: "",
  method: "GET",
  requestType: "http",
  body: {
    type: "json",
    value: "",
  },
  pathParams: [],
  queryParams: enforceTerminalDraftParameter([]),
  requestHeaders: enforceTerminalDraftParameter([]),

  setServiceBaseUrl: (serviceBaseUrl) =>
    set((state) => {
      state.serviceBaseUrl = serviceBaseUrl;
      state.path = addBaseUrl(serviceBaseUrl, state.path, {
        forceChangeHost: true,
      });
    }),

  updatePath: (path) =>
    set((state) => {
      const matchedRoute = findMatchedRoute(
        state.routes,
        removeBaseUrl(state.serviceBaseUrl, path),
        state.method,
        state.requestType,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
      const nextPathParams = matchedRoute
        ? extractMatchedPathParams(matchedRoute)
        : extractPathParams(path).map(mapPathParamKey);

      state.path = path;
      state.selectedRoute = nextSelectedRoute;
      state.pathParams = nextPathParams;
      state.activeHistoryResponseTraceId =
        state.selectedRoute === nextSelectedRoute
          ? state.activeHistoryResponseTraceId
          : null;
    }),

  updateMethod: (methodInputValue) =>
    set((state) => {
      const requestType = methodInputValue === "WS" ? "websocket" : "http";
      const method = methodInputValue === "WS" ? "GET" : methodInputValue;

      state.method = method;
      state.requestType = requestType;

      // Update other state properties based on the new method and request type
      // (e.g., selectedRoute, visibleRequestsPanelTabs, activeRequestsPanelTab, etc.)
      // You might want to move some of this logic to separate functions or slices
    }),

  setPathParams: (pathParams) =>
    set((state) => {
      const nextPath = pathParams.reduce((accPath, param) => {
        if (param.enabled) {
          return accPath.replace(`:${param.key}`, param.value || param.key);
        }
        return accPath;
      }, state.selectedRoute?.path ?? state.path);

      state.path = addBaseUrl(state.serviceBaseUrl, nextPath);
      state.pathParams = pathParams;
    }),

  updatePathParamValues: (pathParams) =>
    set((state) => {
      state.pathParams = state.pathParams.map(
        (pathParam: KeyValueParameter) => {
          const replacement = pathParams?.find((p) => p?.key === pathParam.key);
          if (!replacement) {
            return pathParam;
          }

          return {
            ...pathParam,
            value: replacement.value,
            enabled: !!replacement.value,
          };
        },
      );
    }),

  clearPathParams: () =>
    set((state) => {
      state.pathParams = state.pathParams.map((pathParam) => ({
        ...pathParam,
        value: "",
        enabled: false,
      }));
    }),

  setQueryParams: (queryParams) =>
    set((state) => {
      state.queryParams = enforceTerminalDraftParameter(queryParams);
    }),

  setRequestHeaders: (headers) =>
    set((state) => {
      state.requestHeaders = enforceTerminalDraftParameter(headers);
    }),

  setBody: (body) =>
    set((state) => {
      if (body === undefined) {
        state.body =
          state.body.type === "form-data"
            ? {
                type: "form-data",
                value: enforceFormDataTerminalDraftParameter([]),
                isMultipart: state.body.isMultipart,
              }
            : state.body.type === "file"
              ? { type: state.body.type, value: undefined }
              : { type: state.body.type, value: "" };
      } else if (typeof body === "string") {
        state.body = { type: "text", value: body };
      } else {
        if (body.type === "form-data") {
          const nextBodyValue = enforceFormDataTerminalDraftParameter(
            body.value,
          );
          const shouldForceMultipart = nextBodyValue.some(
            (param) => param.value.value instanceof File,
          );
          state.body = {
            type: body.type,
            isMultipart: shouldForceMultipart || body.isMultipart,
            value: nextBodyValue,
          };
          updateContentTypeHeader(state);
        } else {
          state.body = body;
        }
      }
    }),

  handleRequestBodyTypeChange: (requestBodyType, isMultipart) =>
    set((state) => {
      setBodyTypeReducer(state, { type: requestBodyType, isMultipart });
      updateContentTypeHeader(state);
    }),

  // TODO - change the function ref when the serviceBaseUrl is updated
  removeServiceUrlFromPath: (path: string) =>
    removeBaseUrl(get().serviceBaseUrl, path),

  activeHistoryResponseTraceId: null,
  activeResponse: null,
  showResponseBodyFromHistory: (traceId) =>
    set((state) => {
      state.activeHistoryResponseTraceId = traceId;
      state.activeResponse = null;
    }),
  clearResponseBodyFromHistory: () =>
    set((state) => {
      state.activeHistoryResponseTraceId = null;
    }),
  setActiveResponse: (response) =>
    set((state) => {
      state.activeResponse = response;
    }),

  /** Session history related state */
  sessionHistory: [],
  recordRequestInSessionHistory: (traceId: string) =>
    set((state) => {
      state.sessionHistory.push(traceId);
    }),
});

// // Helper functions
// function setBodyTypeReducer(state: RequestorState, { type, isMultipart }: { type: RequestBodyType; isMultipart?: boolean }) {
//   // Implementation
// }

// function addContentTypeHeader(state: RequestorState) {
//   // Implementation
// }
