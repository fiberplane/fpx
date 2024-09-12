import type {
  RequestBodyType,
  RequestorBody,
  RequestsPanelTab,
  ResponsePanelTab,
} from "..";
import type { KeyValueParameter } from "../../KeyValueForm";
import type { ProbedRoute } from "../../types";
import type {
  RequestMethod,
  RequestMethodInputValue,
  RequestType,
} from "../../types";
import type { RequestorActiveResponse } from "../types";

type RequestorTraceId = string;

export interface RequestResponseSlice {
  serviceBaseUrl: string;
  path: string;
  method: RequestMethod;
  requestType: RequestType;
  body: RequestorBody;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  requestHeaders: KeyValueParameter[];
  setServiceBaseUrl: (serviceBaseUrl: string) => void;
  updatePath: (path: string) => void;
  updateMethod: (methodInputValue: RequestMethodInputValue) => void;
  setPathParams: (pathParams: KeyValueParameter[]) => void;
  updatePathParamValues: (pathParams: { key: string; value: string }[]) => void;
  clearPathParams: () => void;
  setQueryParams: (queryParams: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  setBody: (body: undefined | string | RequestorBody) => void;
  handleRequestBodyTypeChange: (
    requestBodyType: RequestBodyType,
    isMultipart?: boolean,
  ) => void;
  /** Response related state */
  activeHistoryResponseTraceId: string | null;
  activeResponse: RequestorActiveResponse | null;

  showResponseBodyFromHistory: (traceId: string) => void;
  clearResponseBodyFromHistory: () => void;
  setActiveResponse: (response: RequestorActiveResponse | null) => void;

  /** Session history related state */
  sessionHistory: RequestorTraceId[];
  recordRequestInSessionHistory: (traceId: RequestorTraceId) => void;
}

export interface RoutesSlice {
  routes: ProbedRoute[];
  activeRoute: ProbedRoute | null;
  setRoutes: (routes: ProbedRoute[]) => void;
  setActiveRoute: (route: ProbedRoute) => void;

  routesAndMiddleware: ProbedRoute[];
  getMatchingMiddleware: () => null | ProbedRoute[];
  setRoutesAndMiddleware: (routesAndMiddleware: ProbedRoute[]) => void;
}

export interface TabsSlice {
  activeRequestsPanelTab: RequestsPanelTab;
  visibleRequestsPanelTabs: RequestsPanelTab[];
  activeResponsePanelTab: ResponsePanelTab;
  visibleResponsePanelTabs: ResponsePanelTab[];
  setActiveRequestsPanelTab: (tab: string) => void;
  setActiveResponsePanelTab: (tab: string) => void;
}

export interface WebsocketSlice {
  websocketMessage: string;
  setWebsocketMessage: (websocketMessage: string | undefined) => void;
}

export interface UISlice {
  sidePanelOpen: boolean;
  setSidePanelOpen: (sidePanelOpen: boolean) => void;
}

export type Store = RequestResponseSlice &
  RoutesSlice &
  TabsSlice &
  WebsocketSlice &
  UISlice;
