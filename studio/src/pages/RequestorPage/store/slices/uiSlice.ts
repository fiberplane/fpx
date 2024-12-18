import { isLgScreen } from "@/utils";
import type { StateCreator } from "zustand";
import type { NavigationRoutesView } from "../types";
import {
  type BOTTOM_PANEL_NAMES,
  type Store,
  type UISlice,
  validBottomPanelNames,
} from "./types";

export const uiSlice: StateCreator<
  Store,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  UISlice
> = (set) => {
  return {
    navigationPanelRoutesView: "list",
    setNavigationPanelRoutesView: (tab: NavigationRoutesView) =>
      set((state) => {
        state.navigationPanelRoutesView = tab;
      }),
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
    aiDropdownOpen: false,
    setAIDropdownOpen: (open: boolean) =>
      set((state) => {
        state.aiDropdownOpen = open;
      }),
    sidePanel: isLgScreen() ? "open" : "closed",
    bottomPanels: validBottomPanelNames,
    bottomPanelIndex: undefined,
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
    togglePanel: (panelName: "sidePanel" | BOTTOM_PANEL_NAMES) =>
      set((state) => {
        if (!isBottomPanelName(panelName)) {
          state[panelName] = state[panelName] === "open" ? "closed" : "open";
          return;
        }

        const index = state.bottomPanels.indexOf(panelName);
        if (index !== -1) {
          if (state.bottomPanelIndex === index) {
            state.bottomPanelIndex = undefined;
          } else {
            state.bottomPanelIndex = index;
          }
        }
      }),
    setBottomPanelIndex(index: number | undefined) {
      set((state) => {
        if (state.bottomPanels.length === 0) {
          state.bottomPanelIndex = undefined;
          return;
        }
        if (index === undefined) {
          state.bottomPanelIndex = undefined;
          return;
        }

        state.bottomPanelIndex =
          index < state.bottomPanels.length ? index : undefined;
      });
    },
  };
};

function isBottomPanelName(element: unknown): element is BOTTOM_PANEL_NAMES {
  return (
    typeof element === "string" &&
    validBottomPanelNames.includes(element as BOTTOM_PANEL_NAMES)
  );
}
