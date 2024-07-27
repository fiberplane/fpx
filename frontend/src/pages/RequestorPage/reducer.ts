import { useReducer } from "react";
import { KeyValueParameter } from "./KeyValueForm";
import { enforceTerminalDraftParameter } from "./KeyValueForm/hooks";
import { ProbedRoute } from "./queries";
import { findMatchedRoute } from "./routes";
import { RequestMethod, RequestMethodInputValue } from "./types";

type RequestType = "http" | "websocket";

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

export type RequestorState = {
  /** All routes */
  routes: ProbedRoute[];
  /** Indicates which route to highlight in the routes panel */
  selectedRoute: ProbedRoute | null;
  /** Path input */
  path: string;
  /** Method input */
  method: RequestMethod;
  /** Request type input */
  requestType: RequestType;

  /** Query parameters to be sent with the request */
  queryParams: KeyValueParameter[];
  /** Path parameters and their corresponding values */
  pathParams: KeyValueParameter[];
  /** Headers to be sent with the request */
  requestHeaders: KeyValueParameter[];
};

const SET_ROUTES = "SET_ROUTES" as const;
const ADD_ROUTE = "ADD_ROUTE" as const;
const ROUTE_INTERSECT = "ROUTE_INTERSECT" as const;
const PATH_UPDATE = "PATH_UPDATE" as const;
const METHOD_UPDATE = "METHOD_UPDATE" as const;
const SELECT_ROUTE = "SELECT_ROUTE" as const;
const SET_PATH_PARAMS = "SET_PATH_PARAMS" as const;
const REPLACE_PATH_PARAM_VALUES = "REPLACE_PATH_PARAM_VALUES" as const;
const CLEAR_PATH_PARAMS = "CLEAR_PATH_PARAMS" as const;
const SET_QUERY_PARAMS = "SET_QUERY_PARAMS" as const;
const SET_HEADERS = "SET_HEADERS" as const;

type RequestorAction =
  | {
      type: typeof SET_ROUTES;
      payload: ProbedRoute[];
    }
  | {
      type: typeof ADD_ROUTE;
      payload: ProbedRoute;
    }
  | {
      type: typeof ROUTE_INTERSECT;
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
    };

const initialState: RequestorState = {
  routes: [],
  selectedRoute: null,
  path: "",
  method: "GET",
  requestType: "http",

  pathParams: [],
  queryParams: enforceTerminalDraftParameter([]),
  requestHeaders: enforceTerminalDraftParameter([]),
};

function requestorReducer(
  state: RequestorState,
  action: RequestorAction,
): RequestorState {
  switch (action.type) {
    case SET_ROUTES: {
      return { ...state, routes: action.payload };
    }
    case ADD_ROUTE: {
      return { ...state, routes: [...state.routes, action.payload] };
    }
    case ROUTE_INTERSECT: {
      const nextRoutes = state.routes.filter((r) =>
        action.payload.some((ar) => routeEquality(r, ar)),
      );
      return { ...state, routes: nextRoutes };
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
      // TODO - Refactor
      // This logic will reconcile the path param values with what the user is typing
      let nextPathParams = state.pathParams;
      if (matchedRoute?.pathParamValues) {
        nextPathParams = Object.entries(matchedRoute.pathParamValues).map(
          ([key, value]) => ({
            ...mapPathParamKey(key),
            value,
            enabled: !!value,
          }),
        );
      }
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
      return {
        ...state,
        method,
        requestType,
        selectedRoute: nextSelectedRoute,
      };
    }
    case SELECT_ROUTE:
      return {
        ...state,
        selectedRoute: action.payload,
        path: action.payload.path,
        method: probedRouteToInputMethod(action.payload),
        requestType: action.payload.requestType,

        // TODO - We could merge these with existing path params to re-use existing values
        //        But maybe that'd be annoying?
        //        Example would be: If user just had `userId` param set to `123`,
        //        and we select a new route that has `userId` in the path, we'd
        //        have it re-use the existing `userId` param, not create a new blank one.
        //
        pathParams: extractPathParams(action.payload.path).map(mapPathParamKey),
      };
    case SET_PATH_PARAMS: {
      return { ...state, pathParams: action.payload };
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
    default:
      return state;
  }
}

const routeEquality = (a: ProbedRoute, b: ProbedRoute): boolean => {
  return (
    a.path === b.path &&
    a.method === b.method &&
    a.routeOrigin === b.routeOrigin &&
    a.requestType === b.requestType
  );
};

export function useRefactoredRequestorState() {
  const [state, dispatch] = useReducer(requestorReducer, initialState);

  const addRouteIfNotPresent = (route: ProbedRoute) => {
    const shouldInsert = state.routes.every((r) => !routeEquality(r, route));
    if (shouldInsert) {
      dispatch({ type: ADD_ROUTE, payload: route });
    }
  };

  const removeRoutesIfNotPresent = (routes: ProbedRoute[]) => {
    dispatch({ type: ROUTE_INTERSECT, payload: routes });
  };

  const updatePath = (path: string) => {
    dispatch({ type: PATH_UPDATE, payload: path });
  };

  /**
   * Updates the method and request type based on the input value from a RequestMethodComboBox
   * If the input value is "WS", the request type is set to "websocket" and the method is set to "GET"
   *
   * @param methodInputValue - Assumed to come from a RequestMethodComboBox, which could include the value "WS"
   */
  const updateMethod = (methodInputValue: RequestMethodInputValue) => {
    const requestType = methodInputValue === "WS" ? "websocket" : "http";
    const method = methodInputValue === "WS" ? "GET" : methodInputValue;
    dispatch({ type: METHOD_UPDATE, payload: { method, requestType } });
  };

  const selectRoute = (route: ProbedRoute) => {
    dispatch({ type: SELECT_ROUTE, payload: route });
  };

  const setPathParams = (pathParams: KeyValueParameter[]) => {
    dispatch({ type: SET_PATH_PARAMS, payload: pathParams });
  };

  const updatePathParamValues = (
    pathParams: { key: string; value: string }[],
  ) => {
    dispatch({ type: REPLACE_PATH_PARAM_VALUES, payload: pathParams });
  };

  const clearPathParams = () => {
    dispatch({ type: CLEAR_PATH_PARAMS });
  };

  const setQueryParams = (queryParams: KeyValueParameter[]) => {
    const parametersWithDraft = enforceTerminalDraftParameter(queryParams);
    dispatch({ type: SET_QUERY_PARAMS, payload: parametersWithDraft });
  };

  const setRequestHeaders = (headers: KeyValueParameter[]) => {
    const parametersWithDraft = enforceTerminalDraftParameter(headers);
    dispatch({ type: SET_HEADERS, payload: parametersWithDraft });
  };

  /**
   * NOTE - When there's no selected route, we return a "draft" route
   */
  const getActiveRoute = (): ProbedRoute => _getActiveRoute(state);

  const getIsInDraftMode = (): boolean => {
    return !state.selectedRoute;
  };

  return {
    state,
    dispatch,

    // Api
    addRouteIfNotPresent,
    removeRoutesIfNotPresent,
    selectRoute,

    // Form fields
    updatePath,
    updateMethod,
    setPathParams,
    updatePathParamValues,
    clearPathParams,
    setQueryParams,
    setRequestHeaders,

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
    result.push(match[1]);
  }
  return result;
}

function mapPathParamKey(key: string) {
  return { key, value: "", id: key, enabled: false };
}
