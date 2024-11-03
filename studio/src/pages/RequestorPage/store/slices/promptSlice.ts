import type { StateCreator } from "zustand";
import type { ProbedRoute } from "../../types";
import type { PromptPanelSlice } from "./types";

export const promptSlice: StateCreator<
  PromptPanelSlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set, get) => ({
  promptText: "",
  setPromptText: (promptText) =>
    set((state) => {
      state.promptText = promptText;
    }),

  planStepProgressMap: null,
  setPlanStepProgress: (index, planStepProgress) =>
    set((state) => {
      state.planStepProgressMap = state.planStepProgressMap ?? {};
      state.planStepProgressMap[index] = planStepProgress;
    }),
  getPlanStepProgress: (index) => get().planStepProgressMap?.[index] ?? "idle",

  planStepResponseMap: null,
  setPlanStepResponse: (index, planStepResponse) =>
    set((state) => {
      state.planStepResponseMap = state.planStepResponseMap ?? {};
      state.planStepResponseMap[index] = planStepResponse;
    }),
  getPlanStepResponse: (index) => get().planStepResponseMap?.[index],
  getRoutesInPlan: (routes: ProbedRoute[]) => {
    const state = get();
    return state.plan?.steps
      ?.flatMap((command) => routes.find((r) => r.id === command.routeId))
      .filter((route) => route !== undefined);
  },

  // executing as in we are in a running plan and executing steps
  executingPlanStepIdx: undefined,
  setExecutingPlanStepIdx: (executingPlanStepId) =>
    set((state) => {
      state.executingPlanStepIdx = executingPlanStepId;
    }),
  incrementExecutingPlanStepIdx: () =>
    set((state) => {
      if (typeof state.executingPlanStepIdx === "number") {
        state.executingPlanStepIdx = state.executingPlanStepIdx + 1;
      } else {
        state.executingPlanStepIdx = 0;
      }
    }),

  // hacky way to pause for input...
  planRunAwaitingInput: false,
  setPlanRunAwaitingIntput: (awaitingInput: boolean) => {
    set((state) => {
      state.planRunAwaitingInput = awaitingInput;
    });
  },

  // active as in actively editing
  activePlanStepIdx: undefined,
  setActivePlanStepIdx: (activePlanStepId) =>
    set((state) => {
      state.activePlanStepIdx = activePlanStepId;
    }),
  plan: undefined,
  setPlan: (plan) =>
    set((state) => {
      state.plan = plan;
    }),
  clearPlan: () =>
    set((state) => {
      state.planStepProgressMap = null;
      state.planStepResponseMap = null;
      state.executingPlanStepIdx = undefined;
      state.plan = undefined;
    }),

  updatePlanStep: (idx, update) =>
    set((state) => {
      if (state?.plan?.steps?.[idx]) {
        state.plan.steps[idx] = { ...state.plan.steps[idx], ...update };
      }
    }),
  workflowState: "idle",
  setWorkflowState: (workflowState) =>
    set((state) => {
      state.workflowState = workflowState;
    }),
});
