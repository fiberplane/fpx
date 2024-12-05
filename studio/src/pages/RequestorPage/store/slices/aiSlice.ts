import type { StateCreator } from "zustand";
import type { AiState, Store } from "./types";

export const aiSlice: StateCreator<
  Store,
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
