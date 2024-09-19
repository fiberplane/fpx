import { isLgScreen } from "@/utils";
import type { StateCreator } from "zustand";
import type { UISlice } from "./types";

export const uiSlice: StateCreator<
  UISlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set) => {
  return {
    sidePanel: isLgScreen() ? "open" : "closed",
    logsPanel: "closed",
    timelinePanel: "closed",
    aiPanel: "closed",
    togglePanel: (panelName) =>
      set((state) => ({
        [panelName]: state[panelName] === "open" ? "closed" : "open",
      })),
  };
};
