import type { StateCreator } from "zustand";
import type { PromptPanelSlice } from "./types";

export const promptSlice: StateCreator<
  PromptPanelSlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set) => ({
  promptText: "",
  setPromptText: (promptText) =>
    set((state) => {
      state.promptText = promptText;
    }),
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
  updatePlanStep: (idx, update) =>
    set((state) => {
      if (state?.plan?.[idx]) {
        state.plan[idx] = { ...state.plan[idx], ...update };
      }
    }),
  workflowState: "idle",
  setWorkflowState: (workflowState) =>
    set((state) => {
      state.workflowState = workflowState;
    }),
});
