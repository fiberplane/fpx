import { createObjectFromKeyValueParameters } from "@/utils";
import type { StateCreator } from "zustand";
import { enforceFormDataTerminalDraftParameter } from "../../FormDataForm";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import { isOpenApiOperation } from "../../RequestPanel/RouteDocumentation";
import { findMatchedRoute } from "../../routes";
import type { ApiRoute } from "../../types";
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
  resolvePathWithParameters,
} from "../utils";
import {
  generateFakeData,
  transformToFormBody,
  transformToFormParams,
} from "../utils-faker";
import type { ApiCallData, RequestResponseSlice, StudioState } from "./types";

export const requestResponseSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  RequestResponseSlice
> = (set, get) => ({
  serviceBaseUrl: "http://localhost:8787",
  path: "",
  method: "GET",
  apiCallState: {
    // This is needed to avoid the case where there are no routes yet loaded
    // and so path/method is still set to the default value
    // the key should be whatever the `getRouteId` function would generate based on the state
    GET_: createInitialApiCallData(),
  },

  // HACK - This setter has a bunch of side effects (logs, alerts)
  //        I moved it to the store so that it'd be a static handler.
  fillInFakeData: () => {
    const state = get();
    const { activeRoute } = state;
    if (!activeRoute?.openApiSpec) {
      console.error("No route spec found or parseable");
      window.alert("No route spec found or parseable");
      return;
    }

    try {
      const openApiSpec = JSON.parse(activeRoute.openApiSpec);
      if (!isOpenApiOperation(openApiSpec)) {
        console.error("Invalid OpenAPI spec");
        window.alert("Invalid OpenAPI spec");
        return;
      }

      const fakeData = generateFakeData(openApiSpec, activeRoute.path);
      // Transform data to match form state types
      set((state) => {
        const id = getRouteId(state.activeRoute || state);
        const { apiCallState } = state;
        if (id in apiCallState === false) {
          apiCallState[id] = createInitialApiCallData();
        }

        const params = apiCallState[id];

        params.body = transformToFormBody(fakeData.body);
        const fakeQueryParams = transformToFormParams(fakeData.queryParams);
        if (fakeQueryParams.length > 0) {
          params.queryParams = enforceTerminalDraftParameter(
            transformToFormParams(fakeData.queryParams),
          );
        }
        const fakeHeaders = transformToFormParams(fakeData.headers);
        if (fakeHeaders.length > 0) {
          params.requestHeaders = enforceTerminalDraftParameter(fakeHeaders);
        }
        const fakePathParams = transformToFormParams(fakeData.pathParams).map(
          (param) => ({
            ...param,
            id: param.key,
          }),
        );

        if (fakePathParams.length > 0) {
          // TODO: check if this can be safely removed
          // // NOTE - Do not call `state.setPathParams(...)` here, it messes with the form inputs and clears the path params
          // const nextPath = resolvePathWithParameters(
          //   state.activeRoute?.path ?? state.path,
          //   fakePathParams,
          // );
          // state.path = addBaseUrl(state.serviceBaseUrl, nextPath);
          // state.pathParams = fakePathParams;
          params.pathParams = fakePathParams;
        }
      });
    } catch (e) {
      console.error("Error parsing OpenAPI spec:", e);
      window.alert("Error parsing OpenAPI spec");
    }
  },

  // TODO update it so it works
  setCurrentAuthorizationId: (authorizationId: string | null) =>
    set((state) => {
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      params.authorizationId = authorizationId;
    }),

  setServiceBaseUrl: (serviceBaseUrl) =>
    set((state) => {
      if (state.serviceBaseUrl === serviceBaseUrl) {
        return;
      }
      state.serviceBaseUrl = serviceBaseUrl;
      state.path = addBaseUrl(serviceBaseUrl, state.path, {
        forceChangeHost: true,
      });

      // The path might be changed, so verify that there's a default
      // `apiCallState` value
      const id = getRouteId(state.activeRoute || state);
      if (id in state.apiCallState === false) {
        state.apiCallState[id] = createInitialApiCallData();
      }
    }),

  updatePath: (path) =>
    set((state) => {
      const matchedRoute = findMatchedRoute(
        state.appRoutes,
        removeBaseUrl(state.serviceBaseUrl, path),
        state.method,
      );
      const nextActiveRoute = matchedRoute ? matchedRoute.route : null;
      const nextPathParams = matchedRoute
        ? extractMatchedPathParams(matchedRoute)
        : extractPathParams(path).map(mapPathParamKey);

      state.path = path;
      state.activeRoute = nextActiveRoute;
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      params.pathParams = nextPathParams;
    }),

  updateMethod: (method) =>
    set((state) => {
      state.method = method;

      // Update other state properties based on the new method and request type
      // (e.g., activeRoute, visibleRequestsPanelTabs, activeRequestsPanelTab, etc.)
      // You might want to move some of this logic to separate functions or slices
      const matchedRoute = findMatchedRoute(
        state.appRoutes,
        removeBaseUrl(state.serviceBaseUrl, state.path),
        state.method,
      );
      const nextActiveRoute = matchedRoute ? matchedRoute.route : null;
      state.activeRoute = nextActiveRoute;

      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      // Update visibleRequestsPanelTabs based on the new method and request type
      state.visibleRequestsPanelTabs = getVisibleRequestPanelTabs({
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

  // TODO update it so it works
  setCurrentPathParams: (pathParams) =>
    set((state) => {
      const nextPath = resolvePathWithParameters(
        state.activeRoute?.path ?? state.path,
        pathParams,
      );
      state.path = addBaseUrl(state.serviceBaseUrl, nextPath);
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      // state.pathParams = pathParams;
      params.pathParams = pathParams;
    }),

  // TODO: so that it works
  updateCurrentPathParamValues: (pathParams) =>
    set((state) => {
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];

      params.pathParams = params.pathParams.map(
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

  // TODO: update it so it works
  clearCurrentPathParams: () =>
    set((state) => {
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      params.pathParams = params.pathParams.map((pathParam) => ({
        ...pathParam,
        value: "",
        enabled: false,
      }));
    }),

  // TODO: update it so it works
  setCurrentQueryParams: (queryParams) =>
    set((state) => {
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      params.queryParams = enforceTerminalDraftParameter(queryParams);
    }),

  // TODO: update it so it works
  setCurrentRequestHeaders: (headers) =>
    set((state) => {
      // Merge persistent auth headers with request headers
      // const persistentHeaders = state.persistentAuthHeaders || [];
      const mergedHeaders = [...headers];

      // // Add persistent headers if they don't already exist
      // for (const persistentHeader of persistentHeaders) {
      //   if (persistentHeader.enabled) {
      //     const headerExists = mergedHeaders.some(
      //       (h) => h.key.toLowerCase() === persistentHeader.key.toLowerCase(),
      //     );
      //     if (!headerExists) {
      //       mergedHeaders.push(persistentHeader);
      //     }
      //   }
      // }

      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      params.requestHeaders = enforceTerminalDraftParameter(mergedHeaders);
    }),

  // TODO: update it so it works
  setCurrentBody: (body) =>
    set((state) => {
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const params = apiCallState[id];
      if (body === undefined) {
        params.body =
          params.body.type === "form-data"
            ? {
                type: "form-data",
                value: enforceFormDataTerminalDraftParameter([]),
                isMultipart: params.body.isMultipart,
              }
            : params.body.type === "file"
              ? { type: params.body.type, value: undefined }
              : { type: params.body.type, value: "" };
      } else if (typeof body === "string") {
        params.body = { type: "text", value: body };
      } else {
        if (body.type === "form-data") {
          const nextBodyValue = enforceFormDataTerminalDraftParameter(
            body.value,
          );
          const shouldForceMultipart = nextBodyValue.some(
            (param) => param.value.value instanceof File,
          );
          params.body = {
            type: body.type,
            isMultipart: shouldForceMultipart || body.isMultipart,
            value: nextBodyValue,
          };
          updateContentTypeHeaderInState(state);
        } else if (body.type === "file") {
          // When the user adds a file, we want to use the file's type as the content type header
          params.body = body;
          updateContentTypeHeaderInState(state);
        } else {
          params.body = body;
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

  // activeResponse: null,

  setActiveResponse: (response) =>
    set((state) => {
      const { apiCallState } = state;
      const id = getRouteId(state.activeRoute || state);

      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData();
      }

      const apiData = apiCallState[id];
      apiData.activeResponse = response;
    }),

  /** Session history related state */
  sessionHistory: [],
  recordRequestInSessionHistory: (traceId: string) =>
    set((state) => {
      state.sessionHistory.push(traceId);
    }),
});

export function createInitialApiCallData(): ApiCallData {
  return {
    authorizationId: null,
    body: {
      type: "json",
      value: "",
    },
    pathParams: [],
    queryParams: enforceTerminalDraftParameter([]),
    requestHeaders: enforceTerminalDraftParameter([]),
    activeResponse: null,
  };
}

export function getRouteId({
  method,
  path,
}: Pick<RequestResponseSlice, "method" | "path">): string {
  return `${method.toUpperCase()}_${path}`;
}

export function constructFullPath(
  serviceBaseUrl: string,
  route: ApiRoute,
  data: ApiCallData,
): string {
  let fullPath = addBaseUrl(serviceBaseUrl, route.path);
  fullPath = resolvePathWithParameters(
    fullPath,
    data.pathParams.filter((param) => param.enabled),
  );
  // const url = new URL(fullPath);
  const searchParams = new URLSearchParams(
    createObjectFromKeyValueParameters(data.queryParams),
  );

  return searchParams.size > 0
    ? `${fullPath}?${searchParams.toString()}`
    : fullPath;
}
