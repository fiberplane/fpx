import { isLgScreen } from "@/utils";
import type { StateCreator } from "zustand";
import {
  type BOTTOM_PANEL_NAMES,
  type UISlice,
  validBottomPanelNames,
} from "./types";

export const uiSlice: StateCreator<
  UISlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set) => {
  return {
    sidePanel: isLgScreen() ? "open" : "closed",
    bottomPanels: validBottomPanelNames,
    bottomPanelIndex: undefined,
    togglePanel: (
      panelName: Exclude<keyof UISlice, "togglePanel"> | BOTTOM_PANEL_NAMES,
    ) =>
      set((state) => {
        if (isBottomPanelName(panelName)) {
          const index = state.bottomPanels.indexOf(panelName);
          if (index !== -1) {
            if (state.bottomPanelIndex === index) {
              state.bottomPanelIndex = undefined;
            } else {
              state.bottomPanelIndex = index;
            }
          }
          // if (state.bottomPanels.includes(panelName)) {
          //   state.bottomPanels = state.bottomPanels.filter(
          //     (name) => name !== panelName,
          //   );

          //   if (
          //     state.bottomPanelIndex === undefined ||
          //     state.bottomPanelIndex >= state.bottomPanels.length
          //   ) {
          //     state.bottomPanelIndex = state.bottomPanels.length - 1;
          //   }

          //   if (state.bottomPanels.length === 0) {
          //     state.bottomPanelIndex = undefined;
          //   }

          //   console.log(
          //     "state.bottomPanels",
          //     state.bottomPanels,
          //     state.bottomPanelIndex,
          //   );
          // } else {
          //   state.bottomPanels.push(panelName);
          //   state.bottomPanelIndex = state.bottomPanels.length - 1;
          // }
        } else {
          state[panelName] === "open" ? "closed" : "open";
        }
        // if (panelName === "bottomPanel") {
        //   state[panelName] = undefined;
        //   return;
        // }
        // console.log(panelName, isBottomPanelName(panelName));
        // if (isBottomPanelName(panelName)) {
        //   state.bottomPanel =
        //     state[panelName] === "open" ? panelName : undefined;
        // }
        // if (state.aiPanel === "closed" && state.logsPanel === "closed" && state.timelinePanel === "closed") {
        //   state.bottomPanel = undefined;
        // }
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
  // console.log(validBottomPanelNames, validBottomPanelNames.includes(element));
  return (
    typeof element === "string" &&
    validBottomPanelNames.includes(element as BOTTOM_PANEL_NAMES)
  );
}
