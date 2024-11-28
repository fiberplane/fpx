import type { StateCreator } from "zustand";
import type { Store, WebsocketSlice } from "./types";

export const websocketSlice: StateCreator<
  Store,
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
