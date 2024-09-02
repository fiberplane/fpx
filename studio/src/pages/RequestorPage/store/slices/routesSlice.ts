import { StateCreator } from 'zustand';
import { ProbedRoute } from '../../queries';
import { RequestMethod } from '../../types';
import { extractMatchedPathParams, extractPathParams, mapPathParamKey, removeBaseUrl, addBaseUrl } from '../../reducer/reducer';
import { findMatchedRoute } from '../../routes';
import { getVisibleRequestPanelTabs, getVisibleResponsePanelTabs } from '../../reducer/tabs';
import { updateContentTypeHeader } from '../../reducer/reducers';
import { RoutesSlice } from './types';

export const routesSlice: StateCreator<
  RoutesSlice,
  [['zustand/immer', never], ['zustand/devtools', never]]
> = (set) => ({
  routes: [],
  selectedRoute: null,

  setRoutes: (routes) => set((state) => {
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

  selectRoute: (route) => set((state) => {
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
    state.activeRequestsPanelTab = state.visibleRequestsPanelTabs.includes(state.activeRequestsPanelTab)
      ? state.activeRequestsPanelTab
      : state.visibleRequestsPanelTabs[0];

    state.visibleResponsePanelTabs = getVisibleResponsePanelTabs({
      requestType: nextRequestType,
    });
    state.activeResponsePanelTab = state.visibleResponsePanelTabs.includes(state.activeResponsePanelTab)
      ? state.activeResponsePanelTab
      : state.visibleResponsePanelTabs[0];

    // Add content type header (you might want to move this to a separate function)
    updateContentTypeHeader(state);
  }),

});

// Helper functions
function probedRouteToInputMethod(route: ProbedRoute): RequestMethod {
  const method = route.method.toUpperCase();
  switch (method) {
    case "GET":
    case "POST":
    case "PUT":
    case "DELETE":
    case "OPTIONS":
    case "PATCH":
    case "HEAD":
      return method;
    default:
      return "GET";
  }
}

// // You'll need to implement these functions or import them from the appropriate files
// function getVisibleRequestPanelTabs(params: { requestType: RequestType; method: RequestMethod }) {
//   // Implementation
// }

// function getVisibleResponsePanelTabs(params: { requestType: RequestType }) {
//   // Implementation
// }

// function addContentTypeHeader(state: RequestorState) {
//   // Implementation
// }
