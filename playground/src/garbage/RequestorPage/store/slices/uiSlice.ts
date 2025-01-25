import { isLgScreen } from "@/utils";
import type { StateCreator } from "zustand";
import type { StudioState, UISlice } from "./types";

export const uiSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  UISlice
> = (set) => {
  return {
    settingsOpen: false,
    defaultSettingsTab: null,
    setSettingsOpen: (
      open: boolean,
      defaultSettingsTab: string | null = null,
    ) =>
      set((state) => {
        state.settingsOpen = open;
        state.defaultSettingsTab = defaultSettingsTab;
      }),

    sidePanel: isLgScreen() ? "open" : "closed",
    togglePanel: (panelName: "sidePanel") =>
      set((state) => {
        state[panelName] = state[panelName] === "open" ? "closed" : "open";
        return;
      }),

    timelineShowLogs: true,
    timelineAsTree: true,
    toggleTimelineAsTree: () =>
      set((state) => {
        state.timelineAsTree = !state.timelineAsTree;
      }),
    toggleTimelineLogs: () =>
      set((state) => {
        state.timelineShowLogs = !state.timelineShowLogs;
      }),

    shortcutsOpen: false,
    setShortcutsOpen: (open: boolean) =>
      set((state) => {
        state.shortcutsOpen = open;
      }),
  };
};
