import type {
  RequestorBody,
  RequestorBodyType,
  RequestsPanelTab,
  ResponsePanelTab,
} from "..";
import type { ProxiedRequestResponse } from "../../queries";
import type { ProbedRoute } from "../../types";
import type {
  RequestMethod,
  RequestMethodInputValue,
  RequestType,
} from "../../types";
import type { KeyValueParameter, RequestorActiveResponse } from "../types";
import type { SettingsSlice } from "./settingsSlice";

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
  authorizationId: "none" | string | null;
  fillInFakeData: () => void;
  setServiceBaseUrl: (serviceBaseUrl: string) => void;
  updatePath: (path: string) => void;
  updateMethod: (methodInputValue: RequestMethodInputValue) => void;
  setPathParams: (pathParams: KeyValueParameter[]) => void;
  updatePathParamValues: (pathParams: { key: string; value: string }[]) => void;
  clearPathParams: () => void;
  setQueryParams: (queryParams: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  setAuthorizationId: (authorizationId: string | null) => void;
  setBody: (body: undefined | string | RequestorBody) => void;
  handleRequestBodyTypeChange: (
    requestBodyType: RequestorBodyType,
    isMultipart?: boolean,
  ) => void;
  /** Response related state */

  activeResponse: RequestorActiveResponse | null;

  showResponseBodyFromHistory: (traceId: string) => void;
  setActiveResponse: (response: RequestorActiveResponse | null) => void;

  /** Session history related state */
  sessionHistory: RequestorTraceId[];
  recordRequestInSessionHistory: (traceId: RequestorTraceId) => void;
  setRequestParams: (
    requestParams: Pick<
      ProxiedRequestResponse["app_requests"],
      | "requestBody"
      | "requestHeaders"
      | "requestMethod"
      | "requestPathParams"
      | "requestQueryParams"
      | "requestRoute"
      | "requestUrl"
    >,
  ) => void;
}

export interface RoutesSlice {
  appRoutes: ProbedRoute[];
  activeRoute: ProbedRoute | null;
  setRoutes: (routes: ProbedRoute[]) => void;
  setActiveRoute: (route: ProbedRoute) => void;
  routesAndMiddleware: ProbedRoute[];
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

export type PanelState = "open" | "closed";

export interface UISlice {
  sidePanel: PanelState;
  togglePanel: (panelName: "sidePanel") => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  timelineShowLogs: boolean;
  timelineAsTree: boolean;
  toggleTimelineLogs: () => void;
  toggleTimelineAsTree: () => void;
}

export type StudioState = RequestResponseSlice &
  RoutesSlice &
  TabsSlice &
  UISlice &
  SettingsSlice;
