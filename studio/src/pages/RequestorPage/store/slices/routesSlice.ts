import type { StateCreator } from "zustand";
import {
  addBaseUrl,
  extractMatchedPathParams,
  extractPathParams,
  mapPathParamKey,
  removeBaseUrl,
} from "../../reducer/reducer";
import { updateContentTypeHeader } from "../../reducer/reducers";
import {
  getVisibleRequestPanelTabs,
  getVisibleResponsePanelTabs,
} from "../../reducer/tabs";
import { findMatchedRoute } from "../../routes";
import type { ProbedRoute, RequestMethod } from "../../types";
import type { RoutesSlice, Store } from "./types";

export const routesSlice: StateCreator<
  Store,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  RoutesSlice
> = (set) => ({
  routes: [],
  selectedRoute: null,

  setRoutes: (routes) =>
    set((state) => {
      const matchedRoute = findMatchedRoute(
        routes,
        removeBaseUrl(state.serviceBaseUrl, state.path),
        state.method,
        state.requestType,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
      const nextPathParams = matchedRoute
        ? extractMatchedPathParams(matchedRoute)
        : extractPathParams(state.path).map(mapPathParamKey);

      state.routes = routes;
      state.selectedRoute = nextSelectedRoute;
      state.pathParams = nextPathParams;
    }),

  selectRoute: (route) =>
    set((state) => {
      const nextMethod = probedRouteToInputMethod(route);
      const nextRequestType = route.requestType;

      state.selectedRoute = route;
      state.path = addBaseUrl(state.serviceBaseUrl, route.path, {
        requestType: nextRequestType,
      });
      state.method = nextMethod;
      state.requestType = nextRequestType;
      state.pathParams = extractPathParams(route.path).map(mapPathParamKey);
      state.activeHistoryResponseTraceId = null;
      state.activeResponse = null;

      // Update tabs (you might want to move this logic to a separate slice)
      state.visibleRequestsPanelTabs = getVisibleRequestPanelTabs({
        requestType: nextRequestType,
        method: nextMethod,
      });
      state.activeRequestsPanelTab = state.visibleRequestsPanelTabs.includes(
        state.activeRequestsPanelTab,
      )
        ? state.activeRequestsPanelTab
        : state.visibleRequestsPanelTabs[0];

      state.visibleResponsePanelTabs = getVisibleResponsePanelTabs({
        requestType: nextRequestType,
      });
      state.activeResponsePanelTab = state.visibleResponsePanelTabs.includes(
        state.activeResponsePanelTab,
      )
        ? state.activeResponsePanelTab
        : state.visibleResponsePanelTabs[0];

      // Add content type header (you might want to move this to a separate function)
      updateContentTypeHeader(state);
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
