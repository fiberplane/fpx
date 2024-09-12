import { isLgScreen } from "@/utils";
import type { StateCreator } from "zustand";
import type { UISlice } from "./types";

export const uiSlice: StateCreator<
  UISlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set) => {
  return {
    sidePanelOpen: isLgScreen(),
    setSidePanelOpen: (sidePanelOpen) => set({ sidePanelOpen }),
  };
};
