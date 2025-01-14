import type { StateCreator } from "zustand";
import type { StudioState, WebsocketSlice } from "./types";

export const websocketSlice: StateCreator<
  StudioState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  WebsocketSlice
> = (set) => ({
  websocketMessage: "",
  setWebsocketMessage: (websocketMessage) =>
    set((state) => {
      state.websocketMessage = websocketMessage ?? "";
    }),
});
