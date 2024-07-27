import { useReducer } from "react";
import { ProbedRoute } from "./queries";
import { findMatchedRoute } from "./routes";

type RequestType = "http" | "websocket";
type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH" | "HEAD" | "WS";
type RequestMethodInputValue = RequestMethod | "WS";

const _getActiveRoute = (state: RequestorState): ProbedRoute => {
  return state.selectedRoute ?? {
    path: state.path,
    method: state.method,
    isWs: state.requestType === "websocket",
    handler: "",
    handlerType: "route",
    currentlyRegistered: false,
    routeOrigin: "custom",
    isDraft: true,
  };
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
};

const SET_ROUTES = "SET_ROUTES" as const;
const ADD_ROUTE = "ADD_ROUTE" as const;
const PATH_UPDATE = "PATH_UPDATE" as const;
const METHOD_UPDATE = "METHOD_UPDATE" as const;
const SELECT_ROUTE = "SELECT_ROUTE" as const;

type RequestorAction = {
  type: typeof SET_ROUTES;
  payload: ProbedRoute[];
} | {
  type: typeof ADD_ROUTE;
  payload: ProbedRoute;
} | {
  type: typeof PATH_UPDATE;
  payload: string;
} | {
  type: typeof METHOD_UPDATE;
  payload: {
    method: RequestMethodInputValue;
    requestType: RequestType;
  };
} | {
  type: typeof SELECT_ROUTE;
  payload: ProbedRoute;
};

const initialState: RequestorState = {
  routes: [],
  selectedRoute: null,
  path: "",
  method: "GET",
  requestType: "http"
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
    case PATH_UPDATE: {
      const nextPath = action.payload;
      const isWs = state.requestType === "websocket"; 
      const matchedRoute = findMatchedRoute(state.routes, nextPath, state.method, isWs);
      const nextSelectedRoute = matchedRoute ? matchedRoute : null;
      return { ...state, path: action.payload, selectedRoute: nextSelectedRoute };
    }
    case METHOD_UPDATE: {
      const { method, requestType } = action.payload;
      const isWs = requestType === "websocket";
      const matchedRoute = findMatchedRoute(state.routes, state.path, method, isWs);
      const nextSelectedRoute = matchedRoute ? matchedRoute : null;
      return { ...state, method, requestType, selectedRoute: nextSelectedRoute };
    }
    case SELECT_ROUTE:
      return {
        ...state,
        selectedRoute: action.payload,
        path: action.payload.path,
        method: probedRouteToInputMethod(action.payload),
        requestType: action.payload.isWs ? "websocket" : "http",
      };
    default:
      return state;
  }
}

const routeEquality = (a: ProbedRoute, b: ProbedRoute): boolean => {
  return (
    a.path === b.path &&
    a.method === b.method &&
    a.routeOrigin === b.routeOrigin &&
    !!a.isWs === !!b.isWs
  );
};

export function useRefactoredRequestorState() {
  const [state, dispatch] = useReducer(requestorReducer, initialState);

  const addRouteIfNotPresent = (route: ProbedRoute) => {
    const shouldInsert = state.routes.every(r => !routeEquality(r, route));
    if (shouldInsert) {
      dispatch({ type: ADD_ROUTE, payload: route });
    }
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
    selectRoute,

    // Form fields
    updatePath,
    updateMethod,

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