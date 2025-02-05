import type { StateCreator } from "zustand";
import { findMatchedRoute } from "../../routes";
import { updateContentTypeHeaderInState } from "../content-type";
import { getVisibleRequestPanelTabs } from "../tabs";
import {
  addBaseUrl,
  apiRouteToInputMethod,
  extractMatchedPathParams,
  extractPathParams,
  mapPathParamKey,
  removeBaseUrl,
} from "../utils";
import {
  extractQueryParamsFromOpenApiDefinition,
  filterDisabledEmptyQueryParams,
} from "../utils-openapi";
import type { RoutesSlice, StudioState } from "./types";

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

      state.appRoutes = routes;
      state.activeRoute = nextSelectedRoute;
      state.pathParams = nextPathParams;
    }),

  setActiveRoute: (route) =>
    set((state) => {
      const nextMethod = apiRouteToInputMethod(route);
      const nextRequestType = route.requestType;

      state.activeRoute = route;
      state.path = addBaseUrl(state.serviceBaseUrl, route.path, {
        requestType: nextRequestType,
      });
      state.method = nextMethod;
      state.requestType = nextRequestType;
      state.pathParams = extractPathParams(route.path).map(mapPathParamKey);
      state.activeResponse = null;
      // Filter out disabled and empty query params
      // TODO - Only do this if the route has an open api definition?
      state.queryParams = filterDisabledEmptyQueryParams(state.queryParams);
      // Extract query params from the open api definition, if it exists
      state.queryParams = extractQueryParamsFromOpenApiDefinition(
        state.queryParams,
        route,
      );

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
