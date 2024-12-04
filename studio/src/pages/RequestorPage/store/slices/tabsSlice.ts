import type { StateCreator } from "zustand";
import type { RequestsPanelTab, ResponsePanelTab } from "..";
import type { TabsSlice } from "./types";

export const tabsSlice: StateCreator<
  TabsSlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
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
  return ["params", "headers", "body", "docs", "websocket"].includes(tab);
}

function isResponsePanelTab(tab: string): tab is ResponsePanelTab {
  return ["response", "messages", "headers"].includes(tab);
}
