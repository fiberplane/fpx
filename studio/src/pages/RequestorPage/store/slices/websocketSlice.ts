import type { StateCreator } from "zustand";
import type { WebsocketSlice } from "./types";

export const websocketSlice: StateCreator<
  WebsocketSlice,
  [["zustand/immer", never], ["zustand/devtools", never]]
> = (set) => ({
  websocketMessage: "",
  setWebsocketMessage: (websocketMessage) =>
    set((state) => {
      state.websocketMessage = websocketMessage ?? "";
    }),
});
