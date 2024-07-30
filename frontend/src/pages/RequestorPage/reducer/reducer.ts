import { useCallback, useReducer } from "react";
import { KeyValueParameter } from "../KeyValueForm";
import { enforceTerminalDraftParameter } from "../KeyValueForm/hooks";
import { ProbedRoute } from "../queries";
import { findMatchedRoute } from "../routes";
import { RequestMethod, RequestMethodInputValue, RequestType } from "../types";
import { useSaveUiState } from "./persistence";
import { type RequestorState, createInitialState, initialState } from "./state";
import {
  RequestsPanelTab,
  ResponsePanelTab,
  getVisibleRequestPanelTabs,
  getVisibleResponsePanelTabs,
  isRequestsPanelTab,
  isResponsePanelTab,
} from "./tabs";

const _getActiveRoute = (state: RequestorState): ProbedRoute => {
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
const PATH_UPDATE = "PATH_UPDATE" as const;
const METHOD_UPDATE = "METHOD_UPDATE" as const;
const SELECT_ROUTE = "SELECT_ROUTE" as const;
const SET_PATH_PARAMS = "SET_PATH_PARAMS" as const;
const REPLACE_PATH_PARAM_VALUES = "REPLACE_PATH_PARAM_VALUES" as const;
const CLEAR_PATH_PARAMS = "CLEAR_PATH_PARAMS" as const;
const SET_QUERY_PARAMS = "SET_QUERY_PARAMS" as const;
const SET_HEADERS = "SET_HEADERS" as const;
const SET_BODY = "SET_BODY" as const;
const SET_BODY_TYPE = "SET_BODY_TYPE" as const;
const LOAD_HISTORICAL_REQUEST = "LOAD_HISTORICAL_REQUEST" as const;
const SET_ACTIVE_REQUESTS_PANEL_TAB = "SET_ACTIVE_REQUESTS_PANEL_TAB" as const;
const SET_ACTIVE_RESPONSE_PANEL_TAB = "SET_ACTIVE_RESPONSE_PANEL_TAB" as const;

type RequestorAction =
  | {
      type: typeof SET_ROUTES;
      payload: ProbedRoute[];
    }
  | {
      type: typeof PATH_UPDATE;
      payload: string;
    }
  | {
      type: typeof METHOD_UPDATE;
      payload: {
        method: RequestMethod;
        requestType: RequestType;
      };
    }
  | {
      type: typeof SELECT_ROUTE;
      payload: ProbedRoute;
    }
  | {
      type: typeof SET_PATH_PARAMS;
      payload: KeyValueParameter[];
    }
  | {
      // NOTE - This is the action that the AI generated inputs use to "replace" existing path params
      type: typeof REPLACE_PATH_PARAM_VALUES;
      payload: { key: string; value: string }[];
    }
  | {
      type: typeof CLEAR_PATH_PARAMS;
    }
  | {
      type: typeof SET_QUERY_PARAMS;
      payload: KeyValueParameter[];
    }
  | {
      type: typeof SET_HEADERS;
      payload: KeyValueParameter[];
    }
  | {
      type: typeof SET_BODY;
      payload: RequestorState["body"];
    }
  | {
      type: typeof SET_BODY_TYPE;
      payload: {
        type: RequestorState["body"]["type"];
      };
    }
  | {
      type: typeof LOAD_HISTORICAL_REQUEST;
      payload: {
        // TODO
      };
    }
  | {
      type: typeof SET_ACTIVE_REQUESTS_PANEL_TAB;
      payload: RequestsPanelTab;
    }
  | {
      type: typeof SET_ACTIVE_RESPONSE_PANEL_TAB;
      payload: ResponsePanelTab;
    };

function requestorReducer(
  state: RequestorState,
  action: RequestorAction,
): RequestorState {
  switch (action.type) {
    case SET_ROUTES: {
      const nextRoutes = action.payload;
      const matchedRoute = findMatchedRoute(
        nextRoutes,
        state.path,
        state.method,
        state.requestType,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;

      const nextPathParams = matchedRoute
        ? extractMatchedPathParams(matchedRoute)
        : extractPathParams(state.path).map(mapPathParamKey);

      return {
        ...state,
        routes: nextRoutes,
        selectedRoute: nextSelectedRoute,
        pathParams: nextPathParams,
      };
    }
    case PATH_UPDATE: {
      const nextPath = action.payload;
      const matchedRoute = findMatchedRoute(
        state.routes,
        nextPath,
        state.method,
        state.requestType,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
      // This logic will reconcile the path param values with what the user is typing
      // When the route is in a draft state, something kinda funky happens, where a path param will appear
      // but if you fill it in and save it, then the path params disappear...
      // Ask Brett to explain it more if that's confusing
      const nextPathParams = matchedRoute
        ? extractMatchedPathParams(matchedRoute)
        : extractPathParams(nextPath).map(mapPathParamKey);
      return {
        ...state,
        path: action.payload,
        selectedRoute: nextSelectedRoute,
        pathParams: nextPathParams,
      };
    }
    case METHOD_UPDATE: {
      const { method, requestType } = action.payload;
      const matchedRoute = findMatchedRoute(
        state.routes,
        state.path,
        method,
        requestType,
      );
      const nextSelectedRoute = matchedRoute ? matchedRoute.route : null;
      // See comment below for why we want to do this dance
      const nextVisibleRequestsPanelTabs = getVisibleRequestPanelTabs(
        action.payload,
      );
      const nextActiveRequestsPanelTab = nextVisibleRequestsPanelTabs.includes(
        state.activeRequestsPanelTab,
      )
        ? state.activeRequestsPanelTab
        : nextVisibleRequestsPanelTabs[0];

      const nextVisibleResponsePanelTabs = getVisibleResponsePanelTabs(
        action.payload,
      );
      const nextActiveResponsePanelTab = nextVisibleResponsePanelTabs.includes(
        state.activeResponsePanelTab,
      )
        ? state.activeResponsePanelTab
        : nextVisibleResponsePanelTabs[0];
      return {
        ...state,
        method,
        requestType,
        selectedRoute: nextSelectedRoute,

        // Fixes the case where we had "body" tab selected, but then switch to a GET route
        // and the "body" tab isn't visible for GET routes
        visibleRequestsPanelTabs: nextVisibleRequestsPanelTabs,
        activeRequestsPanelTab: nextActiveRequestsPanelTab,

        // Fixes the case where the "messages" tab is selected for a websocket route,
        // but then we switch to a non-websocket route and the "messages" tab contents remain visible
        visibleResponsePanelTabs: nextVisibleResponsePanelTabs,
        activeResponsePanelTab: nextActiveResponsePanelTab,
      };
    }
    case SELECT_ROUTE: {
      // See comment below for why we want to do this dance
      const nextMethod = probedRouteToInputMethod(action.payload);
      const nextRequestType = action.payload.requestType;

      const nextVisibleRequestsPanelTabs = getVisibleRequestPanelTabs({
        requestType: nextRequestType,
        method: nextMethod,
      });
      const nextActiveRequestsPanelTab = nextVisibleRequestsPanelTabs.includes(
        state.activeRequestsPanelTab,
      )
        ? state.activeRequestsPanelTab
        : nextVisibleRequestsPanelTabs[0];

      const nextVisibleResponsePanelTabs = getVisibleResponsePanelTabs({
        requestType: nextRequestType,
      });
      const nextActiveResponsePanelTab = nextVisibleResponsePanelTabs.includes(
        state.activeResponsePanelTab,
      )
        ? state.activeResponsePanelTab
        : nextVisibleResponsePanelTabs[0];
      return {
        ...state,
        selectedRoute: action.payload,

        // Reset form values, but preserve things like path params, query params, headers, etc
        path: action.payload.path,
        method: nextMethod,
        requestType: nextRequestType,

        // TODO - We could merge these with existing path params to re-use existing values
        //        But maybe that'd be annoying?
        //        Example would be: If user just had `userId` param set to `123`,
        //        and we select a new route that has `userId` in the path, we'd
        //        have it re-use the existing `userId` param, not create a new blank one.
        //
        pathParams: extractPathParams(action.payload.path).map(mapPathParamKey),

        // Fixes the case where we had "body" tab selected, but then switch to a GET route
        // and the "body" tab isn't visible for GET routes
        visibleRequestsPanelTabs: nextVisibleRequestsPanelTabs,
        activeRequestsPanelTab: nextActiveRequestsPanelTab,

        // Fixes the case where the "messages" tab is selected for a websocket route,
        // but then we switch to a non-websocket route and the "messages" tab contents remain visible
        visibleResponsePanelTabs: nextVisibleResponsePanelTabs,
        activeResponsePanelTab: nextActiveResponsePanelTab,
      };
    }
    case SET_PATH_PARAMS: {
      // FIXME - This will be buggy in the case where there is a route like
      //         `/users/:id/otheruser/:idOtherUser`
      //         An edge case but... would be annoying
      const nextPath = action.payload.reduce((accPath, param) => {
        if (param.enabled) {
          return accPath.replace(`:${param.key}`, param.value || param.key);
        } else {
          return accPath;
        }
      }, state.selectedRoute?.path ?? state.path);
      return {
        ...state,
        path: nextPath,
        pathParams: action.payload,
      };
    }
    case REPLACE_PATH_PARAM_VALUES: {
      const replacements = action.payload;
      const nextPathParams = state.pathParams.map((pathParam) => {
        const replacement = replacements?.find((p) => p?.key === pathParam.key);
        if (!replacement) {
          return pathParam;
        }
        return {
          ...pathParam,
          value: replacement.value,
          enabled: !!replacement.value,
        };
      });
      return { ...state, pathParams: nextPathParams };
    }
    case CLEAR_PATH_PARAMS: {
      const nextPathParams = state.pathParams.map((pathParam) => ({
        ...pathParam,
        value: "",
        enabled: false,
      }));
      return { ...state, pathParams: nextPathParams };
    }
    case SET_QUERY_PARAMS: {
      return { ...state, queryParams: action.payload };
    }
    case SET_HEADERS: {
      return { ...state, requestHeaders: action.payload };
    }
    case SET_BODY: {
      return { ...state, body: action.payload };
    }
    case SET_BODY_TYPE: {
      const oldBodyValue = state.body.value;
      const oldBodyType = state.body.type;
      const newBodyType = action.payload.type;
      if (oldBodyType === newBodyType) {
        return state;
      }
      if (newBodyType === "form-data") {
        return {
          ...state,
          body: { type: newBodyType, value: enforceTerminalDraftParameter([]) },
        };
      }
      if (oldBodyType === "form-data") {
        return { ...state, body: { type: newBodyType, value: "" } };
      }
      // HACK - This line makes things clearer for typescript
      const newBodyValue = Array.isArray(oldBodyValue) ? "" : oldBodyValue;
      return { ...state, body: { type: newBodyType, value: newBodyValue } };
    }
    case SET_ACTIVE_REQUESTS_PANEL_TAB: {
      return { ...state, activeRequestsPanelTab: action.payload };
    }
    case SET_ACTIVE_RESPONSE_PANEL_TAB: {
      return { ...state, activeResponsePanelTab: action.payload };
    }
    default:
      return state;
  }
}

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
export function useRequestor() {
  const [state, originalDispatch] = useReducer(
    requestorReducer,
    initialState,
    createInitialState,
  );

  // Create a custom dispatch in case we wanna do some debugging
  const dispatch = useCallback((action: RequestorAction) => {
    // NOTE - Useful for debugging!
    // console.log("Dispatching action:", action);
    originalDispatch(action);
  }, []);

  useSaveUiState(state);

  const setRoutes = useCallback(
    (routes: ProbedRoute[]) => {
      dispatch({ type: SET_ROUTES, payload: routes });
    },
    [dispatch],
  );

  const updatePath = useCallback(
    (path: string) => {
      dispatch({ type: PATH_UPDATE, payload: path });
    },
    [dispatch],
  );

  /**
   * Updates the method and request type based on the input value from a RequestMethodComboBox
   * If the input value is "WS", the request type is set to "websocket" and the method is set to "GET"
   *
   * @param methodInputValue - Assumed to come from a RequestMethodComboBox, which could include the value "WS"
   */
  const updateMethod = useCallback(
    (methodInputValue: RequestMethodInputValue) => {
      const requestType = methodInputValue === "WS" ? "websocket" : "http";
      const method = methodInputValue === "WS" ? "GET" : methodInputValue;
      dispatch({ type: METHOD_UPDATE, payload: { method, requestType } });
    },
    [dispatch],
  );

  const selectRoute = useCallback(
    (route: ProbedRoute) => {
      dispatch({ type: SELECT_ROUTE, payload: route });
    },
    [dispatch],
  );

  const setPathParams = useCallback(
    (pathParams: KeyValueParameter[]) => {
      dispatch({ type: SET_PATH_PARAMS, payload: pathParams });
    },
    [dispatch],
  );

  const updatePathParamValues = useCallback(
    (pathParams: { key: string; value: string }[]) => {
      dispatch({ type: REPLACE_PATH_PARAM_VALUES, payload: pathParams });
    },
    [dispatch],
  );

  const clearPathParams = useCallback(() => {
    dispatch({ type: CLEAR_PATH_PARAMS });
  }, [dispatch]);

  const setQueryParams = useCallback(
    (queryParams: KeyValueParameter[]) => {
      const parametersWithDraft = enforceTerminalDraftParameter(queryParams);
      dispatch({ type: SET_QUERY_PARAMS, payload: parametersWithDraft });
    },
    [dispatch],
  );

  const setRequestHeaders = useCallback(
    (headers: KeyValueParameter[]) => {
      const parametersWithDraft = enforceTerminalDraftParameter(headers);
      dispatch({ type: SET_HEADERS, payload: parametersWithDraft });
    },
    [dispatch],
  );

  const setBody = useCallback(
    (body: undefined | string | RequestorState["body"]) => {
      if (body === undefined) {
        dispatch({
          type: SET_BODY,
          payload: { type: "text", value: undefined },
        });
      } else if (typeof body === "string") {
        dispatch({ type: SET_BODY, payload: { type: "text", value: body } });
      } else {
        dispatch({ type: SET_BODY, payload: body });
      }
    },
    [dispatch],
  );

  const handleRequestBodyTypeChange = useCallback(
    (requestBodyType: RequestorState["body"]["type"]) => {
      dispatch({ type: SET_BODY_TYPE, payload: { type: requestBodyType } });
    },
    [dispatch],
  );

  const setActiveRequestsPanelTab = useCallback(
    (tab: string) => {
      if (isRequestsPanelTab(tab)) {
        dispatch({ type: SET_ACTIVE_REQUESTS_PANEL_TAB, payload: tab });
      }
    },
    [dispatch],
  );

  const setActiveResponsePanelTab = useCallback(
    (tab: string) => {
      if (isResponsePanelTab(tab)) {
        dispatch({ type: SET_ACTIVE_RESPONSE_PANEL_TAB, payload: tab });
      }
    },
    [dispatch],
  );

  /**
   * When there's no selected route, we return a "draft" route,
   * which will not appear in the sidebar
   */
  const getActiveRoute = (): ProbedRoute => _getActiveRoute(state);

  /**
   * We consider the inputs in "draft" mode when there's no matching route in the side bar
   */
  const getIsInDraftMode = useCallback((): boolean => {
    return !state.selectedRoute;
  }, [state.selectedRoute]);

  /**
   * Helper to determine whether or not to show a tab in the requests panel
   */
  const shouldShowRequestTab = useCallback(
    (tab: RequestsPanelTab): boolean => {
      return state.visibleRequestsPanelTabs.includes(tab);
    },
    [state.visibleRequestsPanelTabs],
  );

  /**
   * Helper to determine whether or not to show a tab in the response panel
   */
  const shouldShowResponseTab = useCallback(
    (tab: ResponsePanelTab): boolean => {
      return state.visibleResponsePanelTabs.includes(tab);
    },
    [state.visibleResponsePanelTabs],
  );

  return {
    state,
    dispatch,

    // Api
    setRoutes,
    selectRoute,

    // Form fields
    updatePath,
    updateMethod,
    setPathParams,
    updatePathParamValues,
    clearPathParams,
    setQueryParams,
    setRequestHeaders,
    setBody,
    handleRequestBodyTypeChange,

    // Requests Panel tabs
    setActiveRequestsPanelTab,
    shouldShowRequestTab,

    // Response Panel tabs
    setActiveResponsePanelTab,
    shouldShowResponseTab,

    // Selectors
    getActiveRoute,
    getIsInDraftMode,
  };
}
function probedRouteToInputMethod(route: ProbedRoute): RequestMethod {
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
function extractPathParams(path: string) {
  const regex = /\/(:[a-zA-Z0-9_-]+)/g;

  const result: Array<string> = [];
  let match;
  let lastIndex = -1;
  while ((match = regex.exec(path)) !== null) {
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

function mapPathParamKey(key: string) {
  return { key, value: "", id: key, enabled: false };
}

function extractMatchedPathParams(
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
