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
  plan: undefined,
  setPlan: (plan) =>
    set((state) => {
      state.plan = plan;
    }),
});
