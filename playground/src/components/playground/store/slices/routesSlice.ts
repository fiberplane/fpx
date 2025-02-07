import type { StateCreator } from "zustand";
import { findMatchedRoute } from "../../routes";
import { updateContentTypeHeaderInState } from "../content-type";
import { getVisibleRequestPanelTabs } from "../tabs";
import {
  addBaseUrl,
  apiRouteToInputMethod,
  extractPathParams,
  mapPathParamKey,
  removeBaseUrl,
} from "../utils";

import type { ApiRoute } from "../../types";
import { createInitialApiCallData, getRouteId } from "./requestResponseSlice";
import type { RoutesSlice, StudioState } from "./types";

export const routesSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  RoutesSlice
> = (set) => ({
  appRoutes: [],
  activeRoute: null,
  tagOrder: [],
  setRoutes: (routes) =>
    set((state) => {
      const matchedRoute = findMatchedRoute(
        routes,
        removeBaseUrl(state.serviceBaseUrl, state.path),
        state.method,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
      // TODO: set next path params
      // const nextPathParams = matchedRoute
      //   ? extractMatchedPathParams(matchedRoute)
      //   : extractPathParams(state.path).map(mapPathParamKey);

      state.appRoutes = routes;

      state.activeRoute = nextSelectedRoute;
      for (const route of routes) {
        const id = getRouteId({
          method: route.method,
          path: addBaseUrl(state.serviceBaseUrl, route.path, {
            forceChangeHost: true,
          }),
        });

        if (id in state.apiCallState === false) {
          const params = createInitialApiCallData();
          params.pathParams = extractPathParams(route.path).map(
            mapPathParamKey,
          );
          state.apiCallState[id] = params;
          // params.pathParams = extractPathParams(route.path).map(mapPathParamKey);
        }
      }
      // state.pathParams = nextPathParams;
    }),

  setTagOrder: (tagOrder) =>
    set((state) => {
      state.tagOrder = tagOrder;
    }),

  setActiveRoute: (route: ApiRoute) =>
    set((state) => {
      const nextMethod = apiRouteToInputMethod(route);

      state.activeRoute = route;
      state.path = addBaseUrl(state.serviceBaseUrl, route.path);
      state.method = nextMethod;

      const id = getRouteId(state.activeRoute || state);
      const { apiCallState } = state;
      if (id in apiCallState === false) {
        console.log("id", id, Object.keys(state.apiCallState));
        const params = createInitialApiCallData();
        params.pathParams = extractPathParams(route.path).map(mapPathParamKey);
        state.apiCallState[id] = params;
      }

      // const params = apiCallState[id];

      // Is this still needed?
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
});
