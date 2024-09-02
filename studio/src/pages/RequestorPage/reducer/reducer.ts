// import { useCallback, useReducer } from "react";
import { enforceFormDataTerminalDraftParameter } from "../FormDataForm";
import type { KeyValueParameter } from "../KeyValueForm";
// import { enforceTerminalDraftParameter } from "../KeyValueForm/hooks";
import type { ProbedRoute } from "../queries";
import { findMatchedRoute } from "../routes";
import {
  type RequestMethod,
  // type RequestMethodInputValue,
  type RequestType,
  isWsRequest,
} from "../types";
// import { useSaveUiState } from "./persistence";
import {
  //  addContentTypeHeaderToState, 
  setBodyTypeReducer
} from "./reducers";
import {
  type RequestBodyType,
  type RequestorActiveResponse,
  type RequestorBody,
  type RequestorState,
  // createInitialState,
  // initialState,
} from "./state";
import {
  type RequestsPanelTab,
  type ResponsePanelTab,
  getVisibleRequestPanelTabs,
  getVisibleResponsePanelTabs,
  // isRequestsPanelTab,
  // isResponsePanelTab,
} from "./tabs";

export const _getActiveRoute = (state: RequestorState): ProbedRoute => {
  return (
    state.selectedRoute ?? {
      path: state.path,
      method: state.method,
      requestType: state.requestType,
      handler: "",
      handlerType: "route",
      currentlyRegistered: false,
      routeOrigin: "custom",
      isDraft: true,
    }
  );
};

const SET_ROUTES = "SET_ROUTES" as const;
const SET_SERVICE_BASE_URL = "SET_SERVICE_BASE_URL" as const;
const PATH_UPDATE = "PATH_UPDATE" as const;
const METHOD_UPDATE = "METHOD_UPDATE" as const;
const SELECT_ROUTE = "SELECT_ROUTE" as const;
const SET_PATH_PARAMS = "SET_PATH_PARAMS" as const;
const REPLACE_PATH_PARAM_VALUES = "REPLACE_PATH_PARAM_VALUES" as const;
const CLEAR_PATH_PARAMS = "CLEAR_PATH_PARAMS" as const;
const SET_QUERY_PARAMS = "SET_QUERY_PARAMS" as const;
const SET_HEADERS = "SET_HEADERS" as const;
const SET_BODY = "SET_BODY" as const;
const CLEAR_BODY = "CLEAR_BODY" as const;
const SET_BODY_TYPE = "SET_BODY_TYPE" as const;
const SET_WEBSOCKET_MESSAGE = "SET_WEBSOCKET_MESSAGE" as const;
const LOAD_HISTORICAL_REQUEST = "LOAD_HISTORICAL_REQUEST" as const;
const CLEAR_HISTORICAL_REQUEST = "CLEAR_HISTORICAL_REQUEST" as const;
const SET_ACTIVE_RESPONSE = "SET_ACTIVE_RESPONSE" as const;
const SET_ACTIVE_REQUESTS_PANEL_TAB = "SET_ACTIVE_REQUESTS_PANEL_TAB" as const;
const SET_ACTIVE_RESPONSE_PANEL_TAB = "SET_ACTIVE_RESPONSE_PANEL_TAB" as const;

// type RequestorAction =
//   | {
//     type: typeof SET_ROUTES;
//     payload: ProbedRoute[];
//   }
//   | {
//     type: typeof SET_SERVICE_BASE_URL;
//     payload: string;
//   }
//   | {
//     type: typeof PATH_UPDATE;
//     payload: string;
//   }
//   | {
//     type: typeof METHOD_UPDATE;
//     payload: {
//       method: RequestMethod;
//       requestType: RequestType;
//     };
//   }
//   | {
//     type: typeof SELECT_ROUTE;
//     payload: ProbedRoute;
//   }
//   | {
//     type: typeof SET_PATH_PARAMS;
//     payload: KeyValueParameter[];
//   }
//   | {
//     // NOTE - This is the action that the AI generated inputs use to "replace" existing path params
//     type: typeof REPLACE_PATH_PARAM_VALUES;
//     payload: { key: string; value: string }[];
//   }
//   | {
//     type: typeof CLEAR_PATH_PARAMS;
//   }
//   | {
//     type: typeof SET_QUERY_PARAMS;
//     payload: KeyValueParameter[];
//   }
//   | {
//     type: typeof SET_HEADERS;
//     payload: KeyValueParameter[];
//   }
//   | {
//     type: typeof SET_BODY;
//     payload: RequestorBody;
//   }
//   | {
//     type: typeof CLEAR_BODY;
//   }
//   | {
//     type: typeof SET_BODY_TYPE;
//     payload: {
//       type: RequestBodyType;
//       isMultipart?: boolean;
//     };
//   }
//   | {
//     type: typeof SET_WEBSOCKET_MESSAGE;
//     payload: string;
//   }
//   | {
//     type: typeof LOAD_HISTORICAL_REQUEST;
//     payload: {
//       traceId: string;
//     };
//   }
//   | {
//     type: typeof CLEAR_HISTORICAL_REQUEST;
//   }
//   | {
//     type: typeof SET_ACTIVE_RESPONSE;
//     payload: RequestorActiveResponse | null;
//   }
//   | {
//     type: typeof SET_ACTIVE_REQUESTS_PANEL_TAB;
//     payload: RequestsPanelTab;
//   }
//   | {
//     type: typeof SET_ACTIVE_RESPONSE_PANEL_TAB;
//     payload: ResponsePanelTab;
//   };

// function requestorReducer(
//   state: RequestorState,
//   action: RequestorAction,
// ): RequestorState {
//   switch (action.type) {
//     case SET_ROUTES: {
//       const nextRoutes = action.payload;
//       const matchedRoute = findMatchedRoute(
//         nextRoutes,
//         removeBaseUrl(state.serviceBaseUrl, state.path),
//         state.method,
//         state.requestType,
//       );
//       const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;

//       const nextPathParams = matchedRoute
//         ? extractMatchedPathParams(matchedRoute)
//         : extractPathParams(state.path).map(mapPathParamKey);

//       return {
//         ...state,
//         routes: nextRoutes,
//         selectedRoute: nextSelectedRoute,
//         pathParams: nextPathParams,
//       };
//     }
//     case SET_SERVICE_BASE_URL: {
//       return {
//         ...state,
//         serviceBaseUrl: action.payload,
//         path: addBaseUrl(action.payload, state.path, { forceChangeHost: true }),
//       };
//     }
//     case PATH_UPDATE: {
//       const nextPath = action.payload;
//       const matchedRoute = findMatchedRoute(
//         state.routes,
//         removeBaseUrl(state.serviceBaseUrl, nextPath),
//         state.method,
//         state.requestType,
//       );
//       const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
//       // This logic will reconcile the path param values with what the user is typing
//       // When the route is in a draft state, something kinda funky happens, where a path param will appear
//       // but if you fill it in and save it, then the path params disappear...
//       // Ask Brett to explain it more if that's confusing
//       const nextPathParams = matchedRoute
//         ? extractMatchedPathParams(matchedRoute)
//         : extractPathParams(nextPath).map(mapPathParamKey);

//       // If the selected route changed, we want to clear the active history response trace id
//       const nextActiveHistoryResponseTraceId =
//         state.selectedRoute === nextSelectedRoute
//           ? state.activeHistoryResponseTraceId
//           : null;

//       return {
//         ...state,
//         path: action.payload,
//         selectedRoute: nextSelectedRoute,
//         pathParams: nextPathParams,
//         activeHistoryResponseTraceId: nextActiveHistoryResponseTraceId,
//       };
//     }
//     case METHOD_UPDATE: {
//       const { method, requestType } = action.payload;
//       const matchedRoute = findMatchedRoute(
//         state.routes,
//         removeBaseUrl(state.serviceBaseUrl, state.path),
//         method,
//         requestType,
//       );
//       const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
//       // See comment below for why we want to do this dance
//       const nextVisibleRequestsPanelTabs = getVisibleRequestPanelTabs(
//         action.payload,
//       );
//       const nextActiveRequestsPanelTab = nextVisibleRequestsPanelTabs.includes(
//         state.activeRequestsPanelTab,
//       )
//         ? state.activeRequestsPanelTab
//         : nextVisibleRequestsPanelTabs[0];

//       const nextVisibleResponsePanelTabs = getVisibleResponsePanelTabs(
//         action.payload,
//       );
//       const nextActiveResponsePanelTab = nextVisibleResponsePanelTabs.includes(
//         state.activeResponsePanelTab,
//       )
//         ? state.activeResponsePanelTab
//         : nextVisibleResponsePanelTabs[0];
//       return addContentTypeHeaderToState({
//         ...state,
//         method,
//         requestType,
//         selectedRoute: nextSelectedRoute,

//         // Fixes the case where we had "body" tab selected, but then switch to a GET route
//         // and the "body" tab isn't visible for GET routes
//         visibleRequestsPanelTabs: nextVisibleRequestsPanelTabs,
//         activeRequestsPanelTab: nextActiveRequestsPanelTab,

//         // Fixes the case where the "messages" tab is selected for a websocket route,
//         // but then we switch to a non-websocket route and the "messages" tab contents remain visible
//         visibleResponsePanelTabs: nextVisibleResponsePanelTabs,
//         activeResponsePanelTab: nextActiveResponsePanelTab,

//         // HACK - This allows us to stop showing the response body for a historical request
//         activeHistoryResponseTraceId: null,
//       });
//     }
//     case SELECT_ROUTE: {
//       // See comment below for why we want to do this dance
//       const nextMethod = probedRouteToInputMethod(action.payload);
//       const nextRequestType = action.payload.requestType;

//       // The visible tabs in the requests panel are based on the request type and method
//       // If we switch to a new route, it's possible that the "Body" or "Websocket Message" tabs
//       // are no longer visible, so we need to update the currently active tab on the requests panel
//       const nextVisibleRequestsPanelTabs = getVisibleRequestPanelTabs({
//         requestType: nextRequestType,
//         method: nextMethod,
//       });
//       const nextActiveRequestsPanelTab = nextVisibleRequestsPanelTabs.includes(
//         state.activeRequestsPanelTab,
//       )
//         ? state.activeRequestsPanelTab
//         : nextVisibleRequestsPanelTabs[0];

//       // The visible tabs in the response panel are based on the request type (http or websocket)
//       // If we switch to a new route, it's possible that the "Websocket Message" tab
//       // is no longer visible, so we need to update the currently active tab on the response panel
//       const nextVisibleResponsePanelTabs = getVisibleResponsePanelTabs({
//         requestType: nextRequestType,
//       });
//       let nextActiveResponsePanelTab = nextVisibleResponsePanelTabs.includes(
//         state.activeResponsePanelTab,
//       )
//         ? state.activeResponsePanelTab
//         : nextVisibleResponsePanelTabs[0];

//       // One more thing, if the debug tab is selected but we switch to an http route,
//       // we want to switch to the "body" tab instead of the "debug" tab
//       const didSelectedRouteChange = state.selectedRoute !== action.payload;
//       const isDebugTabCurrentlySelected =
//         state.activeResponsePanelTab === "debug";

//       if (didSelectedRouteChange && isDebugTabCurrentlySelected) {
//         // If the selected route changed and the debug tab is selected,
//         // we want to switch to the "body" tab
//         nextActiveResponsePanelTab = "response";
//       }

//       return addContentTypeHeaderToState({
//         ...state,
//         selectedRoute: action.payload,

//         // Reset form values, but preserve things like path params, query params, headers, etc
//         path: addBaseUrl(state.serviceBaseUrl, action.payload.path, {
//           requestType: nextRequestType,
//         }),
//         method: nextMethod,
//         requestType: nextRequestType,

//         // TODO - We could merge these with existing path params to re-use existing values
//         //        But maybe that'd be annoying?
//         //        Example would be: If user just had `userId` param set to `123`,
//         //        and we select a new route that has `userId` in the path, we'd
//         //        have it re-use the existing `userId` param, not create a new blank one.
//         //
//         pathParams: extractPathParams(action.payload.path).map(mapPathParamKey),

//         // Fixes the case where we had "body" tab selected, but then switch to a GET route
//         // and the "body" tab isn't visible for GET routes
//         visibleRequestsPanelTabs: nextVisibleRequestsPanelTabs,
//         activeRequestsPanelTab: nextActiveRequestsPanelTab,

//         // Fixes the case where the "messages" tab is selected for a websocket route,
//         // but then we switch to a non-websocket route and the "messages" tab contents remain visible
//         visibleResponsePanelTabs: nextVisibleResponsePanelTabs,
//         activeResponsePanelTab: nextActiveResponsePanelTab,

//         // HACK - This allows us to stop showing the response body for a historical request
//         activeHistoryResponseTraceId: null,

//         activeResponse: null,
//       });
//     }
//     case SET_PATH_PARAMS: {
//       // FIXME - This will be buggy in the case where there is a route like
//       //         `/users/:id/otheruser/:idOtherUser`
//       //         An edge case but... would be annoying
//       const nextPath = action.payload.reduce((accPath, param) => {
//         if (param.enabled) {
//           return accPath.replace(`:${param.key}`, param.value || param.key);
//         }

//         return accPath;
//       }, state.selectedRoute?.path ?? state.path);
//       return {
//         ...state,
//         path: addBaseUrl(state.serviceBaseUrl, nextPath),
//         pathParams: action.payload,
//       };
//     }
//     case REPLACE_PATH_PARAM_VALUES: {
//       const replacements = action.payload;
//       const nextPathParams = state.pathParams.map((pathParam) => {
//         const replacement = replacements?.find((p) => p?.key === pathParam.key);
//         if (!replacement) {
//           return pathParam;
//         }
//         return {
//           ...pathParam,
//           value: replacement.value,
//           enabled: !!replacement.value,
//         };
//       });
//       return { ...state, pathParams: nextPathParams };
//     }
//     case CLEAR_PATH_PARAMS: {
//       const nextPathParams = state.pathParams.map((pathParam) => ({
//         ...pathParam,
//         value: "",
//         enabled: false,
//       }));
//       return { ...state, pathParams: nextPathParams };
//     }
//     case SET_QUERY_PARAMS: {
//       return { ...state, queryParams: action.payload };
//     }
//     case SET_HEADERS: {
//       return { ...state, requestHeaders: action.payload };
//     }
//     case SET_BODY: {
//       const nextBody = action.payload;
//       if (nextBody.type === "form-data") {
//         const nextBodyValue = enforceFormDataTerminalDraftParameter(
//           nextBody.value,
//         );
//         const shouldForceMultipart = nextBodyValue.some(
//           (param) => param.value.value instanceof File,
//         );
//         return addContentTypeHeaderToState({
//           ...state,
//           body: {
//             type: nextBody.type,
//             isMultipart: shouldForceMultipart || nextBody.isMultipart,
//             value: nextBodyValue,
//           },
//         });
//       }
//       return { ...state, body: nextBody };
//     }
//     case CLEAR_BODY: {
//       const nextBody =
//         state.body.type === "form-data"
//           ? {
//             type: "form-data" as const,
//             value: enforceFormDataTerminalDraftParameter([]),
//             isMultipart: state.body.isMultipart,
//           }
//           : state.body.type === "file"
//             ? { type: state.body.type, value: undefined }
//             : { type: state.body.type, value: "" };
//       return { ...state, body: nextBody };
//     }
//     case SET_BODY_TYPE: {
//       return addContentTypeHeaderToState(setBodyTypeReducer(state, action.payload));
//     }
//     case SET_WEBSOCKET_MESSAGE: {
//       return { ...state, websocketMessage: action.payload };
//     }
//     case LOAD_HISTORICAL_REQUEST: {
//       return {
//         ...state,
//         activeHistoryResponseTraceId: action.payload.traceId,
//         activeResponse: null,
//       };
//     }
//     case CLEAR_HISTORICAL_REQUEST: {
//       return { ...state, activeHistoryResponseTraceId: null };
//     }
//     case SET_ACTIVE_RESPONSE: {
//       return { ...state, activeResponse: action.payload };
//     }
//     case SET_ACTIVE_REQUESTS_PANEL_TAB: {
//       return { ...state, activeRequestsPanelTab: action.payload };
//     }
//     case SET_ACTIVE_RESPONSE_PANEL_TAB: {
//       return { ...state, activeResponsePanelTab: action.payload };
//     }
//     default:
//       return state;
//   }
// }

// Not in use
export const routeEquality = (a: ProbedRoute, b: ProbedRoute): boolean => {
  return (
    a.path === b.path &&
    a.method === b.method &&
    a.routeOrigin === b.routeOrigin &&
    a.requestType === b.requestType
  );
};

/**
 * State management api for the RequestorPage
 *
 * Uses `useReducer` under the hood
 */
// export function useRequestor() {
//   const [state, originalDispatch] = useReducer(
//     requestorReducer,
//     initialState,
//     createInitialState,
//   );

//   // Create a custom dispatch in case we wanna do some debugging
//   const dispatch = useCallback((action: RequestorAction) => {
//     // NOTE - Useful for debugging!
//     // console.log("Dispatching action:", action);
//     originalDispatch(action);
//   }, []);

//   useSaveUiState(state);

//   const setRoutes = useCallback(
//     (routes: ProbedRoute[]) => {
//       dispatch({ type: SET_ROUTES, payload: routes });
//     },
//     [dispatch],
//   );

//   const setServiceBaseUrl = useCallback(
//     (serviceBaseUrl: string) => {
//       dispatch({ type: SET_SERVICE_BASE_URL, payload: serviceBaseUrl });
//     },
//     [dispatch],
//   );

//   const updatePath = useCallback(
//     (path: string) => {
//       dispatch({ type: PATH_UPDATE, payload: path });
//     },
//     [dispatch],
//   );

//   /**
//    * Updates the method and request type based on the input value from a RequestMethodComboBox
//    * If the input value is "WS", the request type is set to "websocket" and the method is set to "GET"
//    *
//    * @param methodInputValue - Assumed to come from a RequestMethodComboBox, which could include the value "WS"
//    */
//   const updateMethod = useCallback(
//     (methodInputValue: RequestMethodInputValue) => {
//       const requestType = methodInputValue === "WS" ? "websocket" : "http";
//       const method = methodInputValue === "WS" ? "GET" : methodInputValue;
//       dispatch({ type: METHOD_UPDATE, payload: { method, requestType } });
//     },
//     [dispatch],
//   );

//   const selectRoute = useCallback(
//     (route: ProbedRoute) => {
//       dispatch({ type: SELECT_ROUTE, payload: route });
//     },
//     [dispatch],
//   );

//   const setPathParams = useCallback(
//     (pathParams: KeyValueParameter[]) => {
//       dispatch({ type: SET_PATH_PARAMS, payload: pathParams });
//     },
//     [dispatch],
//   );

//   const updatePathParamValues = useCallback(
//     (pathParams: { key: string; value: string }[]) => {
//       dispatch({ type: REPLACE_PATH_PARAM_VALUES, payload: pathParams });
//     },
//     [dispatch],
//   );

//   const clearPathParams = useCallback(() => {
//     dispatch({ type: CLEAR_PATH_PARAMS });
//   }, [dispatch]);

//   const setQueryParams = useCallback(
//     (queryParams: KeyValueParameter[]) => {
//       const parametersWithDraft = enforceTerminalDraftParameter(queryParams);
//       dispatch({ type: SET_QUERY_PARAMS, payload: parametersWithDraft });
//     },
//     [dispatch],
//   );

//   const setRequestHeaders = useCallback(
//     (headers: KeyValueParameter[]) => {
//       const parametersWithDraft = enforceTerminalDraftParameter(headers);
//       dispatch({ type: SET_HEADERS, payload: parametersWithDraft });
//     },
//     [dispatch],
//   );

//   const setBody = useCallback(
//     (body: undefined | string | RequestorBody) => {
//       if (body === undefined) {
//         dispatch({ type: CLEAR_BODY });
//       } else if (typeof body === "string") {
//         dispatch({ type: SET_BODY, payload: { type: "text", value: body } });
//       } else {
//         dispatch({ type: SET_BODY, payload: body });
//       }
//     },
//     [dispatch],
//   );

//   const setWebsocketMessage = useCallback(
//     (websocketMessage: string | undefined) => {
//       dispatch({
//         type: SET_WEBSOCKET_MESSAGE,
//         payload: websocketMessage ?? "",
//       });
//     },
//     [dispatch],
//   );

//   const handleRequestBodyTypeChange = useCallback(
//     (requestBodyType: RequestBodyType, isMultipart?: boolean) => {
//       dispatch({
//         type: SET_BODY_TYPE,
//         payload: { type: requestBodyType, isMultipart },
//       });
//     },
//     [dispatch],
//   );

//   const setActiveRequestsPanelTab = useCallback(
//     (tab: string) => {
//       if (isRequestsPanelTab(tab)) {
//         dispatch({ type: SET_ACTIVE_REQUESTS_PANEL_TAB, payload: tab });
//       }
//     },
//     [dispatch],
//   );

//   const setActiveResponsePanelTab = useCallback(
//     (tab: string) => {
//       if (isResponsePanelTab(tab)) {
//         dispatch({ type: SET_ACTIVE_RESPONSE_PANEL_TAB, payload: tab });
//       }
//     },
//     [dispatch],
//   );

//   const showResponseBodyFromHistory = useCallback(
//     (traceId: string) => {
//       dispatch({ type: LOAD_HISTORICAL_REQUEST, payload: { traceId } });
//     },
//     [dispatch],
//   );

//   const clearResponseBodyFromHistory = useCallback(() => {
//     dispatch({ type: CLEAR_HISTORICAL_REQUEST });
//   }, [dispatch]);

//   /**
//    * When there's no selected route, we return a "draft" route,
//    * which will not appear in the sidebar
//    */
//   const getActiveRoute = (): ProbedRoute => _getActiveRoute(state);

//   /**
//    * Helper that removes the service url from a path,
//    * otherwise it returns the path unchanged
//    */
//   const removeServiceUrlFromPath = useCallback(
//     (path: string) => {
//       return removeBaseUrl(state.serviceBaseUrl, path);
//     },
//     [state.serviceBaseUrl],
//   );

//   /**
//    * Helper that adds the service url to a path if it doesn't already have a host
//    */
//   const addServiceUrlIfBarePath = useCallback(
//     (path: string) => {
//       return addBaseUrl(state.serviceBaseUrl, path, {
//         requestType: state.requestType,
//       });
//     },
//     [state.serviceBaseUrl, state.requestType],
//   );

//   /**
//    * We consider the inputs in "draft" mode when there's no matching route in the side bar
//    */
//   const getIsInDraftMode = useCallback((): boolean => {
//     return !state.selectedRoute;
//   }, [state.selectedRoute]);

//   /**
//    * Helper to determine whether or not to show a tab in the requests panel
//    */
//   const shouldShowRequestTab = useCallback(
//     (tab: RequestsPanelTab): boolean => {
//       return state.visibleRequestsPanelTabs.includes(tab);
//     },
//     [state.visibleRequestsPanelTabs],
//   );

//   /**
//    * Helper to determine whether or not to show a tab in the response panel
//    */
//   const shouldShowResponseTab = useCallback(
//     (tab: ResponsePanelTab): boolean => {
//       return state.visibleResponsePanelTabs.includes(tab);
//     },
//     [state.visibleResponsePanelTabs],
//   );

//   /**
//    * Sets the active response in the response panel
//    * This refers to the ACTUAL response body returned through our proxy,
//    * which allows us to show things like binary data in the response panel
//    */
//   const setActiveResponse = useCallback(
//     (response: RequestorActiveResponse | null) => {
//       dispatch({ type: SET_ACTIVE_RESPONSE, payload: response });
//     },
//     [dispatch],
//   );

//   return {
//     state,
//     dispatch,

//     // Api
//     setRoutes,
//     setServiceBaseUrl,
//     selectRoute,

//     // Form fields
//     updatePath,
//     updateMethod,
//     setPathParams,
//     updatePathParamValues,
//     clearPathParams,
//     setQueryParams,
//     setRequestHeaders,
//     setBody,
//     handleRequestBodyTypeChange,
//     addServiceUrlIfBarePath,
//     removeServiceUrlFromPath,

//     // Websocket form
//     setWebsocketMessage,

//     // Requests Panel tabs
//     setActiveRequestsPanelTab,
//     shouldShowRequestTab,

//     // Response Panel tabs
//     setActiveResponsePanelTab,
//     shouldShowResponseTab,

//     // Response Panel response body
//     setActiveResponse,

//     // Selectors
//     getActiveRoute,
//     getIsInDraftMode,

//     // History (WIP)
//     showResponseBodyFromHistory,
//     clearResponseBodyFromHistory,
//   };
// }

export function probedRouteToInputMethod(route: ProbedRoute): RequestMethod {
  const method = route.method.toUpperCase();
  switch (method) {
    case "GET":
      return "GET";
    case "POST":
      return "POST";
    case "PUT":
      return "PUT";
    case "DELETE":
      return "DELETE";
    case "OPTIONS":
      return "OPTIONS";
    case "PATCH":
      return "PATCH";
    case "HEAD":
      return "HEAD";
    default:
      return "GET";
  }
}

/**
 * Extracts path parameters from a path
 *
 * @TODO - Rewrite to use Hono router
 *
 * @param path
 * @returns
 */
export function extractPathParams(path: string) {
  const regex = /\/(:[a-zA-Z0-9_-]+)/g;

  const result: Array<string> = [];
  // let match = regex.exec(path);
  let lastIndex = -1;
  while (true) {
    const match = regex.exec(path);

    if (match === null) {
      break;
    }

    // Check if the regex is stuck in an infinite loop
    if (regex.lastIndex === lastIndex) {
      break;
    }
    lastIndex = regex.lastIndex;

    // HACK - Remove the `:` at the beginning of the match, to make things consistent with Hono router path param matching
    const keyWithoutColon = match[1].slice(1);
    result.push(keyWithoutColon);
  }
  return result;
}

export function mapPathParamKey(key: string) {
  return { key, value: "", id: key, enabled: false };
}

export function extractMatchedPathParams(
  matchedRoute: ReturnType<typeof findMatchedRoute>,
) {
  return Object.entries(matchedRoute?.pathParamValues ?? {}).map(
    ([key, value]) => {
      const nextValue = value === `:${key}` ? "" : value;
      return {
        ...mapPathParamKey(key),
        value: nextValue,
        enabled: !!nextValue,
      };
    },
  );
}

/**
 * Removes the base url from a path so we can try to match a route...
 */
export const removeBaseUrl = (serviceBaseUrl: string, path: string) => {
  if (!pathHasValidBaseUrl(path)) {
    return path;
  }

  if (!pathHasValidBaseUrl(serviceBaseUrl)) {
    return path;
  }

  const serviceHost = new URL(serviceBaseUrl).host;
  const servicePort = new URL(serviceBaseUrl).port;

  const pathHost = new URL(path).host;
  const pathPort = new URL(path).port;

  // TODO - Make this work with query params!!!
  if (pathHost === serviceHost && pathPort === servicePort) {
    return new URL(path).pathname;
  }

  return path;
};

export const addBaseUrl = (
  serviceBaseUrl: string,
  path: string,
  {
    requestType,
    forceChangeHost,
  }: { requestType?: RequestType; forceChangeHost?: boolean } = {
      requestType: "http",
      forceChangeHost: false,
    },
) => {
  // NOTE - This is necessary to allow the user to type new base urls... even though we replace the base url whenever they switch routes
  if (pathHasValidBaseUrl(path) && !forceChangeHost) {
    return path;
  }

  // HACK - Fix this later, not a great pattern
  if (pathHasValidBaseUrl(path) && forceChangeHost) {
    const safeBaseUrl = serviceBaseUrl.endsWith("/")
      ? serviceBaseUrl.slice(0, -1)
      : serviceBaseUrl;
    const parsedPath = new URL(path);
    const search = parsedPath.search;
    return `${safeBaseUrl}${parsedPath.pathname}${search}`;
  }

  const parsedBaseUrl = new URL(serviceBaseUrl);
  if (requestType && isWsRequest(requestType)) {
    parsedBaseUrl.protocol = "ws";
  }
  let updatedBaseUrl = parsedBaseUrl.toString();
  if (updatedBaseUrl.endsWith("/")) {
    updatedBaseUrl = updatedBaseUrl.slice(0, -1);
  }
  if (path?.startsWith(updatedBaseUrl)) {
    return path;
  }

  const safePath = path?.startsWith("/") ? path : `/${path}`;
  return `${updatedBaseUrl}${safePath}`;
};

export function pathHasValidBaseUrl(path: string) {
  try {
    new URL(path);
    return true;
  } catch {
    return false;
  }
}
