import type {
  PlaygroundBody,
  PlaygroundBodyType,
  RequestsPanelTab,
  ResponsePanelTab,
} from "..";
import type { ApiRoute } from "../../types";
import type { KeyValueParameter, PlaygroundActiveResponse } from "../types";
import type { SettingsSlice } from "./settingsSlice";

type TraceId = string;

export interface RequestResponseSlice {
  serviceBaseUrl: string;
  /**
   * A map of "routeId" => request data
   *
   * This allows us to restore the state of the request form
   * on a per-route basis while the user is navigating between
   * different ApiRoutes.
   */
  apiCallState: Record<string, ApiCallData>;
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
  handleRequestBodyTypeChange: (
    requestBodyType: PlaygroundBodyType,
    isMultipart?: boolean,
  ) => void;
  /** Response related state */

  setActiveResponse: (response: PlaygroundActiveResponse | null) => void;

  /** Session history related state */
  sessionHistory: TraceId[];
  recordRequestInSessionHistory: (traceId: TraceId) => void;
}

/**
 * Stores all recently used parameters, scoped to an ApiRoute
 * (query string parameters, path parameters, body, etc.)
 *
 * This allows us to restore the state of the request form
 * on a per-route basis while the user is navigating between
 * different ApiRoutes.
 */
export type ApiCallData = {
  body: PlaygroundBody;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  requestHeaders: KeyValueParameter[];
  /** ID of the user-defined auth scheme to use */
  authorizationId: "none" | string | null;
  /** The response received by the playground from an actual request against the api */
  activeResponse: PlaygroundActiveResponse | null;
};

export interface RoutesSlice {
  appRoutes: ApiRoute[];
  activeRoute: ApiRoute | null;
  tagOrder: string[];
  setRoutes: (routes: ApiRoute[]) => void;
  setActiveRoute: (route: ApiRoute) => void;
  setTagOrder: (tagOrder: string[]) => void;
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
