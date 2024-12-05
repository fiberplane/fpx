export type { ResponsePanelTab, RequestsPanelTab } from "./tabs";
export type {
  RequestBodyType,
  RequestorBody,
  RequestorResponseBody,
  NavigationRoutesView,
  CollapsableTreeNode,
} from "./types";
import { memoize } from "proxy-memoize";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import {
  type Store,
  aiSlice,
  requestResponseSlice,
  routesSlice,
  tabsSlice,
  uiSlice,
  websocketSlice,
} from "./slices";
import { _getActiveRoute } from "./utils";
export { useServiceBaseUrl } from "./useServiceBaseUrl";

export type RequestorState = Store;
export const useRequestorStoreRaw = create<RequestorState>()(
  devtools(
    immer((...a) => ({
      ...routesSlice(...a),
      ...websocketSlice(...a),
      ...tabsSlice(...a),
      ...requestResponseSlice(...a),
      ...uiSlice(...a),
      ...aiSlice(...a),
    })),
    { name: "RequestorStore" },
  ),
);

const getActiveRoute = memoize(_getActiveRoute);

export function useActiveRoute() {
  return useRequestorStoreRaw(useShallow(getActiveRoute));
}

export function useRequestorStore<T extends Store, K extends keyof Store>(
  ...items: Array<K>
): Pick<T, K> {
  const obj = useRequestorStoreRaw(
    useShallow((state) => {
      const result = {} as Pick<T, K>;
      for (const item of items) {
        result[item as K] = state[item] as T[K];
      }

      return result;
    }),
  );
  return obj as Pick<T, K>;
}
