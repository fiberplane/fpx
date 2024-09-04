export type { ResponsePanelTab, RequestsPanelTab } from "./tabs";
export type {
  RequestBodyType,
  RequestorBody,
  RequestorResponseBody,
} from "./types";
import { memoize } from "proxy-memoize";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { requestResponseSlice } from "./slices/requestResponseSlice";
import { routesSlice } from "./slices/routesSlice";
import { tabsSlice } from "./slices/tabsSlice";
import type { Store } from "./slices/types";
import { websocketSlice } from "./slices/websocketSlice";
import { _getActiveRoute } from "./utils";
export { useServiceBaseUrl } from "./useServiceBaseUrl";

export type RequestorState = Store;
export const useRequestorStore = create<RequestorState>()(
  devtools(
    immer((...a) => ({
      ...routesSlice(...a),
      ...websocketSlice(...a),
      ...tabsSlice(...a),
      ...requestResponseSlice(...a),
    })),
    { name: "RequestorStore" },
  ),
);

const getActiveRoute = memoize(_getActiveRoute);

export function useActiveRoute() {
  return useRequestorStore(getActiveRoute);
}
