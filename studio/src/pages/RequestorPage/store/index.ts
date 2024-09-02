import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { memoize } from 'proxy-memoize';
// import { routesSlice } from './slices/routesSlice';
import { websocketSlice } from './slices/websocketSlice';
import { tabsSlice } from './slices/tabsSlice';
// import { responseSlice, ResponseSlice } from './slices/responseSlice';
import { Store } from './slices/types';
import { routesSlice } from './slices/routesSlice';
import { requestResponseSlice } from './slices/requestResponseSlice';
import { initialState } from '../reducer/state';
import { _getActiveRoute } from '../reducer/reducer';
// import { createInitialState } from '../reducer/state';

// ... existing imports ...

export type RequestorState = Store;
export const useRequestorStore = create<RequestorState>()(
  devtools(
    persist(
      immer(
        (...a) => ({
          ...routesSlice(...a),
          ...websocketSlice(...a),
          ...tabsSlice(...a),
          ...requestResponseSlice(...a),
          initialState,
        })
      ),
      {
        name: 'requestor-storage',
        partialize: (state) => ({
          serviceBaseUrl: state.serviceBaseUrl,
          // Add other properties you want to persist
        }),
      }
    ),
    { name: 'RequestorStore' }
  )
);

const getActiveRoute = memoize(_getActiveRoute);

export function useActiveRoute() {
  return useRequestorStore(getActiveRoute);
}

// import {create } from 'zustand';
// import { RequestBodyType, RequestorActiveResponse, RequestorBody, createInitialState, initialState } from '../reducer/state';
// import { addContentTypeHeader, setBodyTypeReducer } from '../reducer/reducers';
// import { findMatchedRoute } from '../routes';
// import { getVisibleRequestPanelTabs, getVisibleResponsePanelTabs, RequestsPanelTab, ResponsePanelTab } from '../reducer/tabs';
// import { RequestMethod, RequestMethodInputValue, RequestType } from '../types';
// import { enforceTerminalDraftParameter, KeyValueParameter } from '../KeyValueForm';
// import { ProbedRoute } from '../queries';
// import { addBaseUrl, extractMatchedPathParams, extractPathParams, mapPathParamKey, removeBaseUrl } from '../reducer/reducer';
// import { enforceFormDataTerminalDraftParameter } from '../FormDataForm';


// export type RequestorState = {
//   /** All routes */
//   routes: ProbedRoute[];
//   /** Indicates which route to highlight in the routes panel */
//   selectedRoute: ProbedRoute | null;

//   // Request form
//   /** Base URL for requests */
//   serviceBaseUrl: string;
//   /** Path input */
//   path: string;
//   /** Method input */
//   method: RequestMethod;
//   /** Request type input */
//   requestType: RequestType;
//   /** Body */
//   body: RequestorBody;
//   /** Path parameters and their corresponding values */
//   pathParams: KeyValueParameter[];
//   /** Query parameters to be sent with the request */
//   queryParams: KeyValueParameter[];
//   /** Headers to be sent with the request */
//   requestHeaders: KeyValueParameter[];

//   // Websocket messages form
//   /** Websocket message */
//   websocketMessage: string;

//   // Tabs
//   /** The tab to show in the requests panel */
//   activeRequestsPanelTab: RequestsPanelTab;
//   /** The tabs to show in the requests panel */
//   visibleRequestsPanelTabs: RequestsPanelTab[];

//   /** The tab to show in the response panel */
//   activeResponsePanelTab: ResponsePanelTab;
//   /** The tabs to show in the response panel */
//   visibleResponsePanelTabs: ResponsePanelTab[];

//   /** The trace id to show in the response panel */
//   activeHistoryResponseTraceId: string | null;

//   /** The response to show in the response panel */
//   activeResponse: RequestorActiveResponse | null;
// };



// type RequestorStore = RequestorState & {
//   setRoutes: (routes: ProbedRoute[]) => void;
//   setServiceBaseUrl: (serviceBaseUrl: string) => void;
//   updatePath: (path: string) => void;
//   updateMethod: (methodInputValue: RequestMethodInputValue) => void;
//   selectRoute: (route: ProbedRoute) => void;
//   setPathParams: (pathParams: KeyValueParameter[]) => void;
//   updatePathParamValues: (pathParams: { key: string; value: string }[]) => void;
//   clearPathParams: () => void;
//   setQueryParams: (queryParams: KeyValueParameter[]) => void;
//   setRequestHeaders: (headers: KeyValueParameter[]) => void;
//   setBody: (body: undefined | string | RequestorState['body']) => void;
//   setWebsocketMessage: (websocketMessage: string | undefined) => void;
//   handleRequestBodyTypeChange: (requestBodyType: RequestBodyType, isMultipart?: boolean) => void;
//   setActiveRequestsPanelTab: (tab: string) => void;
//   setActiveResponsePanelTab: (tab: string) => void;
//   showResponseBodyFromHistory: (traceId: string) => void;
//   clearResponseBodyFromHistory: () => void;
//   setActiveResponse: (response: RequestorState['activeResponse']) => void;
//   removeServiceUrlFromPath: (path: string) => string;
// };

// export const useRequestorStore = create<RequestorStore>((set, get) => ({
//   ...createInitialState(initialState),

//   setRoutes: (routes) => set((state) => {
//     const matchedRoute = findMatchedRoute(
//       routes,
//       removeBaseUrl(state.serviceBaseUrl, state.path),
//       state.method,
//       state.requestType,
//     );
//     const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
//     const nextPathParams = matchedRoute
//       ? extractMatchedPathParams(matchedRoute)
//       : extractPathParams(state.path).map(mapPathParamKey);

//     return {
//       routes,
//       selectedRoute: nextSelectedRoute,
//       pathParams: nextPathParams,
//     };
//   }),

//   setServiceBaseUrl: (serviceBaseUrl) => set((state) => ({
//     serviceBaseUrl,
//     path: addBaseUrl(serviceBaseUrl, state.path, { forceChangeHost: true }),
//   })),

//   updatePath: (path) => set((state) => {
//     const matchedRoute = findMatchedRoute(
//       state.routes,
//       removeBaseUrl(state.serviceBaseUrl, path),
//       state.method,
//       state.requestType,
//     );
//     const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
//     const nextPathParams = matchedRoute
//       ? extractMatchedPathParams(matchedRoute)
//       : extractPathParams(path).map(mapPathParamKey);

//     return {
//       path,
//       selectedRoute: nextSelectedRoute,
//       pathParams: nextPathParams,
//       activeHistoryResponseTraceId: state.selectedRoute === nextSelectedRoute
//         ? state.activeHistoryResponseTraceId
//         : null,
//     };
//   }),

//   updateMethod: (methodInputValue) => set((state) => {
//     const requestType = methodInputValue === "WS" ? "websocket" : "http";
//     const method = methodInputValue === "WS" ? "GET" : methodInputValue;
//     const matchedRoute = findMatchedRoute(
//       state.routes,
//       removeBaseUrl(state.serviceBaseUrl, state.path),
//       method,
//       requestType,
//     );
//     const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
//     const nextVisibleRequestsPanelTabs = getVisibleRequestPanelTabs({ requestType, method });
//     const nextActiveRequestsPanelTab = nextVisibleRequestsPanelTabs.includes(state.activeRequestsPanelTab)
//       ? state.activeRequestsPanelTab
//       : nextVisibleRequestsPanelTabs[0];

//     const nextVisibleResponsePanelTabs = getVisibleResponsePanelTabs({ requestType });
//     const nextActiveResponsePanelTab = nextVisibleResponsePanelTabs.includes(state.activeResponsePanelTab)
//       ? state.activeResponsePanelTab
//       : nextVisibleResponsePanelTabs[0];

//     return addContentTypeHeader({
//       ...state,
//       method,
//       requestType,
//       selectedRoute: nextSelectedRoute,
//       visibleRequestsPanelTabs: nextVisibleRequestsPanelTabs,
//       activeRequestsPanelTab: nextActiveRequestsPanelTab,
//       visibleResponsePanelTabs: nextVisibleResponsePanelTabs,
//       activeResponsePanelTab: nextActiveResponsePanelTab,
//       activeHistoryResponseTraceId: null,
//     });
//   }),

//   selectRoute: (route) => set((state) => {
//     const nextMethod = probedRouteToInputMethod(route);
//     const nextRequestType = route.requestType;
//     const nextVisibleRequestsPanelTabs = getVisibleRequestPanelTabs({
//       requestType: nextRequestType,
//       method: nextMethod,
//     });
//     const nextActiveRequestsPanelTab = nextVisibleRequestsPanelTabs.includes(state.activeRequestsPanelTab)
//       ? state.activeRequestsPanelTab
//       : nextVisibleRequestsPanelTabs[0];

//     const nextVisibleResponsePanelTabs = getVisibleResponsePanelTabs({
//       requestType: nextRequestType,
//     });
//     let nextActiveResponsePanelTab = nextVisibleResponsePanelTabs.includes(state.activeResponsePanelTab)
//       ? state.activeResponsePanelTab
//       : nextVisibleResponsePanelTabs[0];

//     const didSelectedRouteChange = state.selectedRoute !== route;
//     const isDebugTabCurrentlySelected = state.activeResponsePanelTab === "debug";

//     if (didSelectedRouteChange && isDebugTabCurrentlySelected) {
//       nextActiveResponsePanelTab = "response";
//     }

//     return addContentTypeHeader({
//       ...state,
//       selectedRoute: route,
//       path: addBaseUrl(state.serviceBaseUrl, route.path, {
//         requestType: nextRequestType,
//       }),
//       method: nextMethod,
//       requestType: nextRequestType,
//       pathParams: extractPathParams(route.path).map(mapPathParamKey),
//       visibleRequestsPanelTabs: nextVisibleRequestsPanelTabs,
//       activeRequestsPanelTab: nextActiveRequestsPanelTab,
//       visibleResponsePanelTabs: nextVisibleResponsePanelTabs,
//       activeResponsePanelTab: nextActiveResponsePanelTab,
//       activeHistoryResponseTraceId: null,
//       activeResponse: null,
//     });
//   }),

//   setPathParams: (pathParams) => set((state) => {
//     const nextPath = pathParams.reduce((accPath, param) => {
//       if (param.enabled) {
//         return accPath.replace(`:${param.key}`, param.value || param.key);
//       }
//       return accPath;
//     }, state.selectedRoute?.path ?? state.path);
//     return {
//       path: addBaseUrl(state.serviceBaseUrl, nextPath),
//       pathParams,
//     };
//   }),

//   updatePathParamValues: (pathParams) => set((state) => ({
//     pathParams: state.pathParams.map((pathParam) => {
//       const replacement = pathParams?.find((p) => p?.key === pathParam.key);
//       if (!replacement) {
//         return pathParam;
//       }
//       return {
//         ...pathParam,
//         value: replacement.value,
//         enabled: !!replacement.value,
//       };
//     }),
//   })),

//   clearPathParams: () => set((state) => ({
//     pathParams: state.pathParams.map((pathParam) => ({
//       ...pathParam,
//       value: "",
//       enabled: false,
//     })),
//   })),

//   setQueryParams: (queryParams) => set({
//     queryParams: enforceTerminalDraftParameter(queryParams),
//   }),

//   setRequestHeaders: (headers) => set({
//     requestHeaders: enforceTerminalDraftParameter(headers),
//   }),

//   setBody: (body) => set((state) => {
//     if (body === undefined) {
//       return { body: state.body.type === "form-data"
//         ? { type: "form-data", value: enforceFormDataTerminalDraftParameter([]), isMultipart: state.body.isMultipart }
//         : state.body.type === "file"
//           ? { type: state.body.type, value: undefined }
//           : { type: state.body.type, value: "" }
//       };
//     } else if (typeof body === "string") {
//       return { body: { type: "text", value: body } };
//     } else {
//       if (body.type === "form-data") {
//         const nextBodyValue = enforceFormDataTerminalDraftParameter(body.value);
//         const shouldForceMultipart = nextBodyValue.some(
//           (param) => param.value.value instanceof File,
//         );
//         return addContentTypeHeader({
//           ...state,
//           body: {
//             type: body.type,
//             isMultipart: shouldForceMultipart || body.isMultipart,
//             value: nextBodyValue,
//           },
//         });
//       }
//       return { body };
//     }
//   }),

//   setWebsocketMessage: (websocketMessage) => set({
//     websocketMessage: websocketMessage ?? "",
//   }),

//   handleRequestBodyTypeChange: (requestBodyType, isMultipart) => set((state) =>
//     addContentTypeHeader(setBodyTypeReducer(state, { type: requestBodyType, isMultipart }))
//   ),

//   setActiveRequestsPanelTab: (tab) => set((state) => {
//     if (isRequestsPanelTab(tab)) {
//       return { activeRequestsPanelTab: tab  as RequestsPanelTab};
//     }
//     return state;
//   }),

//   setActiveResponsePanelTab: (tab) => set((state) => {
//     if (isResponsePanelTab(tab)) {
//       return { activeResponsePanelTab: tab as ResponsePanelTab };
//     }
//     return state;
//   }),

//   showResponseBodyFromHistory: (traceId) => set({
//     activeHistoryResponseTraceId: traceId,
//     activeResponse: null,
//   }),

//   clearResponseBodyFromHistory: () => set({
//     activeHistoryResponseTraceId: null,
//   }),

//   setActiveResponse: (response) => set({
//     activeResponse: response,
//   }),

//   removeServiceUrlFromPath: (path) => removeBaseUrl(get().serviceBaseUrl, path),
// }));

// // Helper functions (you might want to move these to a separate file)
// function probedRouteToInputMethod(route: ProbedRoute): RequestMethod {
//   const method = route.method.toUpperCase();
//   switch (method) {
//     case "GET":
//     case "POST":
//     case "PUT":
//     case "DELETE":
//     case "OPTIONS":
//     case "PATCH":
//     case "HEAD":
//       return method;
//     default:
//       return "GET";
//   }
// }

// function isRequestsPanelTab(tab: string): tab is RequestsPanelTab {
//   return ["params", "headers", "body", "websocket"].includes(tab);
// }

// function isResponsePanelTab(tab: string): tab is ResponsePanelTab {
//   return ["response", "debug", "messages"].includes(tab);
// }
