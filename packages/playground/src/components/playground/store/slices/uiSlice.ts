import { isLgScreen } from "@/utils";
import type { StateCreator } from "zustand";
import type { StudioState, UISlice } from "./types";

export const uiSlice: StateCreator<
  StudioState,
  [["zustand/devtools", never]],
  [],
  UISlice
> = (set) => {
  return {
    sidePanel: isLgScreen() ? "open" : "closed",
    togglePanel: (panelName: "sidePanel") =>
      set((initialState: StudioState): StudioState => {
        const state = { ...initialState };
        state[panelName] = state[panelName] === "open" ? "closed" : "open";
        return state;
      }),

    timelineShowLogs: true,
    timelineAsTree: true,
    toggleTimelineAsTree: () =>
      set((initialState: StudioState): StudioState => {
        const state = { ...initialState };
        state.timelineAsTree = !state.timelineAsTree;
        return state;
      }),
    toggleTimelineLogs: () =>
      set((initialState: StudioState): StudioState => {
        const state = { ...initialState };
        state.timelineShowLogs = !state.timelineShowLogs;
        return state;
      }),

    shortcutsOpen: false,
    setShortcutsOpen: (open: boolean) =>
      set((initialState: StudioState): StudioState => {
        const state = { ...initialState };
        state.shortcutsOpen = open;
        return state;
      }),
  };
};
