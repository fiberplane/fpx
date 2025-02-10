import { createObjectFromKeyValueParameters } from "@/utils";
import type { StateCreator } from "zustand";
import { enforceFormDataTerminalDraftParameter } from "../../FormDataForm";
import { enforceTerminalDraftParameter } from "../../KeyValueForm";
import { isOpenApiOperation } from "../../RequestPanel/RouteDocumentation";
import type { ApiRoute } from "../../types";
import { updateContentTypeHeaderInState } from "../content-type";
import { setBodyTypeInState } from "../set-body-type";
import type { KeyValueParameter } from "../types";
import {
  addBaseUrl,
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
import {
  extractJsonBodyFromOpenApiDefinition,
  extractQueryParamsFromOpenApiDefinition,
} from "../utils-openapi";
import type { ApiCallData, RequestResponseSlice, StudioState } from "./types";

export const requestResponseSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  RequestResponseSlice
> = (set, get) => ({
  serviceBaseUrl: "http://localhost:8787",
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
        if (!state.activeRoute) {
          console.warn("Can't fill in fake data, there is no active route");
          return;
        }
        const id = getRouteId(state.activeRoute);
        const { apiCallState } = state;
        if (id in apiCallState === false) {
          apiCallState[id] = createInitialApiCallData(state.activeRoute);
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
          params.pathParams = fakePathParams;
        }
      });
    } catch (e) {
      console.error("Error parsing OpenAPI spec:", e);
      window.alert("Error parsing OpenAPI spec");
    }
  },

  setCurrentAuthorizationId: (authorizationId: string | null) =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("Can't set current authorization id, no active route");
        return;
      }
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
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

      if (!state.activeRoute) {
        return;
      }

      // The path might be changed, so verify that there's a default
      // `apiCallState` value
      const id = getRouteId(state.activeRoute);
      if (id in state.apiCallState === false) {
        state.apiCallState[id] = createInitialApiCallData(state.activeRoute);
      }
    }),

  setCurrentPathParams: (pathParams) =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("Unable to set current path parameters: no active route");
        return;
      }

      const id = getRouteId(state.activeRoute);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
      }

      const params = apiCallState[id];
      params.pathParams = pathParams;
    }),

  updateCurrentPathParamValues: (pathParams) =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("Unable to update current path parameter values");
        return;
      }
      const id = getRouteId(state.activeRoute || state);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
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

  clearCurrentPathParams: () =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("No active route (clearCurrentPathParams)");
        return;
      }
      const id = getRouteId(state.activeRoute);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
      }

      const params = apiCallState[id];
      params.pathParams = params.pathParams.map((pathParam) => ({
        ...pathParam,
        value: "",
        enabled: false,
      }));
    }),

  setCurrentQueryParams: (queryParams) =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("No active route (setCurrentQueryParams)");
        return;
      }
      const id = getRouteId(state.activeRoute);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
      }

      const params = apiCallState[id];
      params.queryParams = enforceTerminalDraftParameter(queryParams);
    }),

  setCurrentRequestHeaders: (headers) =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("No active route (setCurrentRequestHeaders)");
        return;
      }
      const id = getRouteId(state.activeRoute);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
      }

      const params = apiCallState[id];
      params.requestHeaders = enforceTerminalDraftParameter(headers);
    }),

  setCurrentBody: (body) =>
    set((state) => {
      if (!state.activeRoute) {
        console.warn("No active route (setCurrentBody)");
        return;
      }
      const id = getRouteId(state.activeRoute);

      const { apiCallState } = state;
      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(state.activeRoute);
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

  setActiveResponse: (response) =>
    set((state) => {
      const { apiCallState, activeRoute } = state;
      if (!activeRoute) {
        throw new Error("Unable to set active response: no active route");
        // return;
      }

      const id = getRouteId(activeRoute);

      if (id in apiCallState === false) {
        apiCallState[id] = createInitialApiCallData(activeRoute);
      }

      const apiData = apiCallState[id];
      apiData.activeResponse = response;
    }),
});

export function createInitialApiCallData(route?: ApiRoute): ApiCallData {
  const data = createEmptyApiCallData();
  if (!route) {
    return data;
  }

  data.pathParams = extractPathParams(route.path).map(mapPathParamKey);
  data.queryParams = extractQueryParamsFromOpenApiDefinition(
    data.queryParams,
    route,
  );
  data.body = extractJsonBodyFromOpenApiDefinition(data.body, route);
  return data;
}

export function createEmptyApiCallData(): ApiCallData {
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
}: Pick<ApiRoute, "method" | "path">): string {
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

  const searchParams = new URLSearchParams(
    createObjectFromKeyValueParameters(data.queryParams),
  );

  return searchParams.size > 0
    ? `${fullPath}?${searchParams.toString()}`
    : fullPath;
}
