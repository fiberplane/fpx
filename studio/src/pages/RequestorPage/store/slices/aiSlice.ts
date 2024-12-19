import type { StateCreator } from "zustand";
import type { AiState, StudioState } from "./types";

export const aiSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  AiState
> = (set) => ({
  currentAiPrompt: undefined,

  setAiPrompt: (prompt?: string) =>
    set((state) => {
      state.currentAiPrompt = prompt;
    }),
});
