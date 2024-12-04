import type { TreeNode } from "@/queries/app-routes";
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
import type {
  CollapsableTreeNode,
  NavigationRoutesView,
  RequestorActiveResponse,
} from "../types";

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
  setActiveHistoryResponseTraceId: (traceId: string | null) => void;

  activeResponse: RequestorActiveResponse | null;
  /** A banner that tells the user they can view logs for a request */
  showViewLogsBanner: boolean;
  setShowViewLogsBanner: (showViewLogsBanner: boolean) => void;

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

  unmatched: Array<ProbedRoute>;
  collapsibleTree: Array<CollapsableTreeNode>;
  updateTreeResult: (
    result:
      | { unmatched: Array<ProbedRoute>; tree: Array<TreeNode> }
      | undefined,
  ) => void;
  setTree: (node: Array<TreeNode>) => void;
  toggleTreeNode: (path: string) => void;

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
  navigationPanelRoutesView: NavigationRoutesView;
  setNavigationPanelRoutesView: (tab: NavigationRoutesView) => void;
  settingsOpen: boolean;
  defaultSettingsTab: string | null;
  setSettingsOpen: (open: boolean, defaultSettingsTab?: string | null) => void;
  aiDropdownOpen: boolean;
  setAIDropdownOpen: (open: boolean) => void;
  sidePanel: PanelState;
  bottomPanels: BOTTOM_PANEL_NAMES[];
  bottomPanelIndex: undefined | number;
  timelineShowLogs: boolean;
  timelineAsTree: boolean;
  toggleTimelineLogs: () => void;
  toggleTimelineAsTree: () => void;
  setBottomPanelIndex(index: number | undefined): void;
  togglePanel: (panelName: "sidePanel" | BOTTOM_PANEL_NAMES) => void;
}

export type BOTTOM_PANEL_NAMES = "logsPanel" | "timelinePanel" | "aiPanel";

export const validBottomPanelNames: BOTTOM_PANEL_NAMES[] = [
  "logsPanel",
  "timelinePanel",
  "aiPanel",
];

export type PanelState = "open" | "closed";

export type Store = RequestResponseSlice &
  RoutesSlice &
  TabsSlice &
  WebsocketSlice &
  UISlice;
