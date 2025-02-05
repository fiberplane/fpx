import type { StateCreator } from "zustand";
import { findMatchedRoute } from "../../routes";
import type { ProbedRoute, RequestMethod } from "../../types";
import { updateContentTypeHeaderInState } from "../content-type";
import { getVisibleRequestPanelTabs } from "../tabs";
import {
  addBaseUrl,
  // extractMatchedPathParams,
  extractPathParams,
  mapPathParamKey,
  removeBaseUrl,
} from "../utils";
import {
  extractQueryParamsFromOpenApiDefinition,
  filterDisabledEmptyQueryParams,
} from "../utils-openapi";
import type { RoutesSlice, StudioState } from "./types";
import { createRequestParameters, getRouteId } from "./requestResponseSlice";

export const routesSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  RoutesSlice
> = (set) => ({
  appRoutes: [],
  activeRoute: null,

  setRoutes: (routes) =>
    set((state) => {
      console.log("set routes", routes.length);
      const matchedRoute = findMatchedRoute(
        routes,
        removeBaseUrl(state.serviceBaseUrl, state.path),
        state.method,
        state.requestType,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
      // TODO: set next path params
      // const nextPathParams = matchedRoute
      //   ? extractMatchedPathParams(matchedRoute)
      //   : extractPathParams(state.path).map(mapPathParamKey);

      state.appRoutes = routes;

      state.activeRoute = nextSelectedRoute;
      for (const route of routes) {
        const id = getRouteId(route);
        if (id in state.requestParameters === false) {
          state.requestParameters[id] = createRequestParameters();
        }
      }
      // state.pathParams = nextPathParams;
    }),

  setActiveRoute: (route) =>
    set((state) => {
      console.log("set active route");
      const nextMethod = probedRouteToInputMethod(route);
      const nextRequestType = route.requestType;

      state.activeRoute = route;
      state.path = addBaseUrl(state.serviceBaseUrl, route.path, {
        requestType: nextRequestType,
      });
      state.method = nextMethod;
      state.requestType = nextRequestType;

      const id = getRouteId(state);
      const { requestParameters } = state;
      if (id in requestParameters === false) {
        requestParameters[id] = createRequestParameters();
      }

      const params = requestParameters[id];

      // params.pathParams = extractPathParams(route.path).map(mapPathParamKey);
      // state.activeResponse = null;
      // // Filter out disabled and empty query params
      // // TODO - Only do this if the route has an open api definition?
      // params.queryParams = filterDisabledEmptyQueryParams(params.queryParams);
      // // Extract query params from the open api definition, if it exists
      // params.queryParams = extractQueryParamsFromOpenApiDefinition(
      //   params.queryParams,
      //   route,
      // );

      // TODO - Instead of automatically setting body here,
      //        have a button? Idk.
      //        All I know is it'd take some bookkeeping to do "automagical bodies" elegantly
      //
      // state.body = extractJsonBodyFromOpenApiDefinition(state.body, route);

      // Update tabs (you might want to move this logic to a separate slice)
      state.visibleRequestsPanelTabs = getVisibleRequestPanelTabs({
        requestType: nextRequestType,
        method: nextMethod,
        openApiSpec: route?.openApiSpec,
      });
      state.activeRequestsPanelTab = state.visibleRequestsPanelTabs.includes(
        state.activeRequestsPanelTab,
      )
        ? state.activeRequestsPanelTab
        : state.visibleRequestsPanelTabs[0];

      state.activeResponsePanelTab = state.visibleResponsePanelTabs.includes(
        state.activeResponsePanelTab,
      )
        ? state.activeResponsePanelTab
        : state.visibleResponsePanelTabs[0];

      // Add content type header (you might want to move this to a separate function)
      updateContentTypeHeaderInState(state);
    }),

  routesAndMiddleware: [],
  setRoutesAndMiddleware: (routesAndMiddleware) =>
    set((state) => {
      state.routesAndMiddleware = routesAndMiddleware;
    }),
});

const SUPPORTED_METHODS: Array<RequestMethod> = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
  "HEAD",
];
// Helper functions
function probedRouteToInputMethod(route: ProbedRoute): RequestMethod {
  const method = route.method.toUpperCase() as RequestMethod;
  // Validate that the method is supported
  if (SUPPORTED_METHODS.includes(method)) {
    return method;
  }

  return "GET";
}
