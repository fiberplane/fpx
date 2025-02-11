import type { StateCreator } from "zustand";
import { findMatchedRoute } from "../../routes";
import { updateContentTypeHeaderInState } from "../content-type";
import { getVisibleRequestPanelTabs } from "../tabs";
import { addBaseUrl, apiRouteToInputMethod, removeBaseUrl } from "../utils";

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
      const path = state.activeRoute?.path || "";
      const method = state.activeRoute?.method || "GET";
      const matchedRoute = findMatchedRoute(
        routes,
        removeBaseUrl(state.serviceBaseUrl, path),
        method,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
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
          const params = createInitialApiCallData(route);
          state.apiCallState[id] = params;
        }
      }
    }),

  setTagOrder: (tagOrder) =>
    set((state) => {
      state.tagOrder = tagOrder;
    }),

  setActiveRoute: (route: ApiRoute) =>
    set((state) => {
      const nextMethod = apiRouteToInputMethod(route);

      state.activeRoute = route;

      const id = getRouteId(state.activeRoute || state);
      const { apiCallState } = state;
      if (id in apiCallState === false) {
        const params = createInitialApiCallData(route);
        state.apiCallState[id] = params;
      }

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
