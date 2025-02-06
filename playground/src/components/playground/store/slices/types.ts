import type {
  PlaygroundBody,
  PlaygroundBodyType,
  RequestsPanelTab,
  ResponsePanelTab,
} from "..";
import type { ApiRoute, RequestMethod } from "../../types";
import type { KeyValueParameter, PlaygroundActiveResponse } from "../types";
import type { SettingsSlice } from "./settingsSlice";

type TraceId = string;

export interface RequestResponseSlice {
  serviceBaseUrl: string;
  path: string;
  method: RequestMethod;
  requestParameters: Record<string, RequestParameters>;
  setCurrentPathParams: (pathParams: KeyValueParameter[]) => void;
  updateCurrentPathParamValues: (
    pathParams: { key: string; value: string }[],
  ) => void;
  clearCurrentPathParams: () => void;
  setCurrentQueryParams: (queryParams: KeyValueParameter[]) => void;
  setCurrentRequestHeaders: (headers: KeyValueParameter[]) => void;
  setCurrentAuthorizationId: (authorizationId: string | null) => void;
  setCurrentBody: (body: undefined | string | PlaygroundBody) => void;
  fillInFakeData: () => void;
  setServiceBaseUrl: (serviceBaseUrl: string) => void;
  updatePath: (path: string) => void;
  updateMethod: (method: RequestMethod) => void;
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
}

// Stores all request (path) specific parameters
// Like query string parameters, path parameters, body, etc...
export type RequestParameters = {
  body: PlaygroundBody;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  requestHeaders: KeyValueParameter[];
  authorizationId: "none" | string | null;
};

export interface RoutesSlice {
  appRoutes: ApiRoute[];
  activeRoute: ApiRoute | null;
  setRoutes: (routes: ApiRoute[]) => void;
  setActiveRoute: (route: ApiRoute) => void;
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
