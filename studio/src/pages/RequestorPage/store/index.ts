import { memoize } from "proxy-memoize";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { _getActiveRoute } from "../reducer/reducer";
import { initialState } from "../reducer/state";
import { requestResponseSlice } from "./slices/requestResponseSlice";
import { routesSlice } from "./slices/routesSlice";
import { tabsSlice } from "./slices/tabsSlice";
import type { Store } from "./slices/types";
import { websocketSlice } from "./slices/websocketSlice";
export { useServiceBaseUrl } from "./useServiceBaseUrl";

export type RequestorState = Store;
export const useRequestorStore = create<RequestorState>()(
  devtools(
    persist(
      immer((...a) => ({
        ...routesSlice(...a),
        ...websocketSlice(...a),
        ...tabsSlice(...a),
        ...requestResponseSlice(...a),
        initialState,
      })),
      {
        name: "requestor-storage",
        partialize: (state) => ({
          serviceBaseUrl: state.serviceBaseUrl,
          // Add other properties you want to persist
        }),
      },
    ),
    { name: "RequestorStore" },
  ),
);

const getActiveRoute = memoize(_getActiveRoute);

export function useActiveRoute() {
  return useRequestorStore(getActiveRoute);
}
