import type {
  PlaygroundBody,
  PlaygroundBodyType,
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
import type { KeyValueParameter, PlaygroundActiveResponse } from "../types";
import type { SettingsSlice } from "./settingsSlice";

type TraceId = string;

export interface RequestResponseSlice {
  serviceBaseUrl: string;
  path: string;
  method: RequestMethod;
  requestType: RequestType;
  body: PlaygroundBody;
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
  setBody: (body: undefined | string | PlaygroundBody) => void;
  handleRequestBodyTypeChange: (
    requestBodyType: PlaygroundBodyType,
    isMultipart?: boolean,
  ) => void;
  /** Response related state */

  activeResponse: PlaygroundActiveResponse | null;

  showResponseBodyFromHistory: (traceId: string) => void;
  setActiveResponse: (response: PlaygroundActiveResponse | null) => void;

  /** Session history related state */
  sessionHistory: TraceId[];
  recordRequestInSessionHistory: (traceId: TraceId) => void;
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
