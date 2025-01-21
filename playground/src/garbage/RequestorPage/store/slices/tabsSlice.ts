import type { StateCreator } from "zustand";
import type { RequestsPanelTab, ResponsePanelTab } from "..";
import type { StudioState, TabsSlice } from "./types";

export const tabsSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  TabsSlice
> = (set) => ({
  activeRequestsPanelTab: "params",
  visibleRequestsPanelTabs: ["params", "headers"],
  activeResponsePanelTab: "response",
  visibleResponsePanelTabs: ["response", "headers"],

  setActiveRequestsPanelTab: (tab) =>
    set((state) => {
      if (isRequestsPanelTab(tab)) {
        state.activeRequestsPanelTab = tab;
      }
    }),
  setActiveResponsePanelTab: (tab) =>
    set((state) => {
      if (isResponsePanelTab(tab)) {
        state.activeResponsePanelTab = tab;
      }
    }),
});

// Helper functions
function isRequestsPanelTab(tab: string): tab is RequestsPanelTab {
  return ["params", "headers", "auth", "body", "docs"].includes(tab);
}

function isResponsePanelTab(tab: string): tab is ResponsePanelTab {
  return ["response", "headers"].includes(tab);
}
