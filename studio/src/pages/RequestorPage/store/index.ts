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

export type { ResponsePanelTab, RequestsPanelTab } from "./tabs";
export type {
  // RequestBodyType,
  RequestorBody,
  RequestorResponseBody,
  NavigationRoutesView,
  CollapsableTreeNode,
  KeyValueParameter,
} from "./types";
export { useServiceBaseUrl } from "./useServiceBaseUrl";
export { KeyValueParameterSchema } from "./types";
export type { RequestorBodyType } from "./request-body";

export type StudioState = Store;
export const useStudioStoreRaw = create<StudioState>()(
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
  return useStudioStoreRaw(useShallow(getActiveRoute));
}

export function useStudioStore<T extends Store, K extends keyof Store>(
  ...items: Array<K>
): Pick<T, K> {
  const obj = useStudioStoreRaw(
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
