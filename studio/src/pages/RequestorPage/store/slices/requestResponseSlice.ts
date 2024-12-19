import {
  constructRequestorBody,
  createKeyValueParametersFromValues,
} from "@/utils";
import type { StateCreator } from "zustand";
import { enforceFormDataTerminalDraftParameter } from "../../FormDataForm";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import type { ProxiedRequestResponse } from "../../queries";
import { findMatchedRoute } from "../../routes";
import { isRequestMethod } from "../../types";
import { updateContentTypeHeaderInState } from "../content-type";
import { setBodyTypeInState } from "../set-body-type";
import { getVisibleRequestPanelTabs } from "../tabs";
import type { KeyValueParameter } from "../types";
import {
  addBaseUrl,
  extractMatchedPathParams,
  extractPathParams,
  mapPathParamKey,
  removeBaseUrl,
} from "../utils";
import type { RequestResponseSlice, StudioState } from "./types";

export const requestResponseSlice: StateCreator<
  StudioState,
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

  showViewLogsBanner: false,
  setShowViewLogsBanner: (showViewLogsBanner) =>
    set((state) => {
      state.showViewLogsBanner = showViewLogsBanner;
    }),

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
        state.appRoutes,
        removeBaseUrl(state.serviceBaseUrl, path),
        state.method,
        state.requestType,
      );
      const nextActiveRoute = matchedRoute ? matchedRoute.route : null;
      const nextPathParams = matchedRoute
        ? extractMatchedPathParams(matchedRoute)
        : extractPathParams(path).map(mapPathParamKey);

      state.path = path;
      state.activeRoute = nextActiveRoute;
      state.pathParams = nextPathParams;
    }),

  updateMethod: (methodInputValue) =>
    set((state) => {
      const requestType = methodInputValue === "WS" ? "websocket" : "http";
      const method = methodInputValue === "WS" ? "GET" : methodInputValue;

      state.method = method;
      state.requestType = requestType;

      // Update other state properties based on the new method and request type
      // (e.g., activeRoute, visibleRequestsPanelTabs, activeRequestsPanelTab, etc.)
      // You might want to move some of this logic to separate functions or slices
      const matchedRoute = findMatchedRoute(
        state.appRoutes,
        removeBaseUrl(state.serviceBaseUrl, state.path),
        state.method,
        state.requestType,
      );
      const nextActiveRoute = matchedRoute ? matchedRoute.route : null;
      state.activeRoute = nextActiveRoute;

      // Update visibleRequestsPanelTabs based on the new method and request type
      state.visibleRequestsPanelTabs = getVisibleRequestPanelTabs({
        requestType,
        method,
        openApiSpec: state.activeRoute?.openApiSpec,
      });

      // Ensure the activeRequestsPanelTab is valid
      state.activeRequestsPanelTab = state.visibleRequestsPanelTabs.includes(
        state.activeRequestsPanelTab,
      )
        ? state.activeRequestsPanelTab
        : state.visibleRequestsPanelTabs[0];
    }),

  setPathParams: (pathParams) =>
    set((state) => {
      const nextPath = pathParams.reduce((accPath, param) => {
        if (param.enabled) {
          return accPath.replace(`:${param.key}`, param.value || param.key);
        }
        return accPath;
      }, state.activeRoute?.path ?? state.path);
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
          updateContentTypeHeaderInState(state);
        } else if (body.type === "file") {
          // When the user adds a file, we want to use the file's type as the content type header
          state.body = body;
          updateContentTypeHeaderInState(state);
        } else {
          state.body = body;
        }
      }
    }),

  handleRequestBodyTypeChange: (requestBodyType, isMultipart) =>
    set((state) => {
      setBodyTypeInState(state, { type: requestBodyType, isMultipart });
      updateContentTypeHeaderInState(state);
    }),

  // TODO - change the function ref when the serviceBaseUrl is updated
  removeServiceUrlFromPath: (path: string) =>
    removeBaseUrl(get().serviceBaseUrl, path),

  activeResponse: null,
  showResponseBodyFromHistory: (traceId) =>
    set((state) => {
      // Recall that an 'active response' is one for which we will have the body we received from the service
      // This means it can contain binary data, whereas the history response will not
      // We should prefer to keep the active response as response to render, so long as its traceId matches the current history response traceId
      const activeTraceId = state.activeResponse?.traceId;
      if (!activeTraceId || activeTraceId !== traceId) {
        console.debug("Trace id mismatch, Setting active response to null");
        state.activeResponse = null;
      }
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

  setRequestParams: (
    requestParams: Pick<
      ProxiedRequestResponse["app_requests"],
      | "requestBody"
      | "requestHeaders"
      | "requestMethod"
      | "requestPathParams"
      | "requestQueryParams"
      | "requestRoute"
      | "requestUrl"
    >,
  ) => {
    const {
      requestBody,
      requestHeaders,
      requestMethod,
      requestPathParams = {},
      requestQueryParams = {},
    } = requestParams;

    // Updating the path has the side effect of clearing/resetting the path params
    // So it's good to do this early
    get().updatePath(requestParams.requestUrl);

    get().updateMethod(
      requestMethod === "WS" || isRequestMethod(requestMethod)
        ? requestMethod
        : "GET",
      // );
    );

    get().setPathParams(
      createKeyValueParametersFromValues(
        Object.entries(requestPathParams || {}).map(([key, value]) => ({
          key,
          value,
        })),
      ),
    );

    get().setQueryParams(
      createKeyValueParametersFromValues(
        Object.entries(requestQueryParams || {}).map(([key, value]) => ({
          key,
          value,
        })),
      ),
    );
    const bodyValue =
      requestBody === undefined || requestBody === null
        ? undefined
        : typeof requestBody !== "string"
          ? JSON.stringify(requestBody)
          : requestBody;
    get().setBody(bodyValue && constructRequestorBody(bodyValue));

    get().setRequestHeaders(
      createKeyValueParametersFromValues(
        Object.entries(requestHeaders || {})
          .map(([key, value]) => ({ key, value }))
          .filter(
            // HACK - We don't want to pass through the trace id header,
            //        Otherwise each successive request will be correlated!!
            ({ key }) => key?.toLowerCase() !== "x-fpx-trace-id",
          ),
      ),
    );
  },
});
