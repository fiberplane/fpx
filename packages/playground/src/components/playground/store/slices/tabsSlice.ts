import type { StateCreator } from "zustand";
import type { RequestsPanelTab, ResponsePanelTab } from "..";
import type { StudioState, TabsSlice } from "./types";

export const tabsSlice: StateCreator<
  StudioState,
  [["zustand/devtools", never]],
  [],
  TabsSlice
> = (set) => ({
  activeRequestsPanelTab: "params",
  visibleRequestsPanelTabs: ["params", "headers", "auth"],
  activeResponsePanelTab: "response",
  visibleResponsePanelTabs: ["response", "headers"],

  setActiveRequestsPanelTab: (tab) =>
    set((initialState: StudioState): StudioState => {
      const state = { ...initialState };
      if (isRequestsPanelTab(tab)) {
        state.activeRequestsPanelTab = tab;
      }

      return state;
    }),
  setActiveResponsePanelTab: (tab) =>
    set((initialState: StudioState): StudioState => {
      const state = { ...initialState };
      if (isResponsePanelTab(tab)) {
        state.activeResponsePanelTab = tab;
      }

      return state;
    }),
});

// Helper functions
function isRequestsPanelTab(tab: string): tab is RequestsPanelTab {
  return ["params", "headers", "auth", "body", "docs"].includes(tab);
}

function isResponsePanelTab(tab: string): tab is ResponsePanelTab {
  return ["response", "headers"].includes(tab);
}
