import type { StateCreator } from "zustand";
import type { UISlice } from "./types";

export const uiSlice: StateCreator<
  UISlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set) => ({
  sidePanelOpen: false,
  setSidePanelOpen: (sidePanelOpen) => set({ sidePanelOpen }),
});
