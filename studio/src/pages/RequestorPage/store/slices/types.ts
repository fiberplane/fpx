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
  setActiveRouteById: (routeId: number) => void;

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
  settingsOpen: boolean;
  defaultSettingsTab: string | null;
  setSettingsOpen: (open: boolean, defaultSettingsTab?: string | null) => void;
  aiDropdownOpen: boolean;
  setAIDropdownOpen: (open: boolean) => void;
  sidePanel: PanelState;
  promptPanel: PanelState;
  bottomPanels: BOTTOM_PANEL_NAMES[];
  bottomPanelIndex: undefined | number;
  timelineShowLogs: boolean;
  timelineAsTree: boolean;
  toggleTimelineLogs: () => void;
  toggleTimelineAsTree: () => void;
  setBottomPanelIndex(index: number | undefined): void;
  togglePanel: (
    panelName: "sidePanel" | "promptPanel" | BOTTOM_PANEL_NAMES,
  ) => void;
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
  UISlice &
  PromptPanelSlice;

export type PlanStepProgress = "idle" | "requesting" | "success" | "error";

export interface PromptPanelSlice {
  promptText: string;
  setPromptText: (promptText: string) => void;
  activePlanStepIdx: number | undefined;
  setActivePlanStepIdx: (activePlanStepId: number | undefined) => void;

  planStepProgressMap: Record<number, PlanStepProgress> | null;
  setPlanStepProgress: (
    index: number,
    planStepProgress: PlanStepProgress,
  ) => void;
  getPlanStepProgress: (index: number) => PlanStepProgress;

  executingPlanStepIdx: number | undefined;
  setExecutingPlanStepIdx: (executingPlanStepId: number | undefined) => void;
  incrementExecutingPlanStepIdx: () => void;

  getRoutesInPlan: (routes: ProbedRoute[]) => ProbedRoute[] | undefined;
  getPlanStepResponse: (index: number) => RequestorActiveResponse | undefined;
  setPlanStepResponse: (
    index: number,
    planStepResponse: RequestorActiveResponse,
  ) => void;
  planStepResponseMap: Record<number, RequestorActiveResponse> | null;
  planRunAwaitingInput: boolean;
  setPlanRunAwaitingIntput: (awaitingInput: boolean) => void;
  plan: Plan | undefined;
  setPlan: (plan: Plan | undefined) => void;
  clearPlan: () => void;
  updatePlanStep: (idx: number, update: Partial<PlanStep>) => void;
  workflowState: PromptWorkflowState;
  setWorkflowState: (workflowState: PromptWorkflowState) => void;
}

export type Plan = {
  description: string;
  steps: PlanStep[];
};

export type PlanStep = {
  routeId: number;
  route: Pick<ProbedRoute, "id" | "path" | "method">;
  payload: {
    path: string;
    headers: KeyValueParameter[];
    queryParameters: KeyValueParameter[];
    pathParameters: KeyValueParameter[];
    // biome-ignore lint/suspicious/noExplicitAny: for now body is any valid JSON
    body: any;
    bodyType: {
      type: RequestBodyType;
      isMultipart: boolean;
    };
  };
};

export type PromptWorkflowState = "editing" | "planning" | "executing" | "idle" | "error" | "completed";
