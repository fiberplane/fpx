import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import {
  type StudioState,
  requestResponseSlice,
  routesSlice,
  settingsSlice,
  tabsSlice,
  uiSlice,
} from "../slices";
import {
  createRequestParameters,
  getRouteId,
} from "../slices/requestResponseSlice";
import type { RequestParameters } from "../slices/types";

export function useStudioStore<
  T extends StudioState,
  K extends keyof StudioState,
>(...items: Array<K>): Pick<T, K> {
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

export const useStudioStoreRaw = create<StudioState>()(
  devtools(
    immer((...a) => ({
      ...routesSlice(...a),
      ...tabsSlice(...a),
      ...requestResponseSlice(...a),
      ...uiSlice(...a),
      ...settingsSlice(...a),
    })),
    { name: "StudioStore" },
  ),
);

// Provide a way to get the store state outside of a component
export const getStudioStoreState = useStudioStoreRaw.getState;

export function useRequestParameters<
  T extends RequestParameters,
  K extends keyof RequestParameters,
>(...items: Array<K>): Pick<T, K> {
  return useStudioStoreRaw(
    useShallow((state) => {
      const id = getRouteId(state);
      const { requestParameters } = state;

      if (id in requestParameters === false) {
        console.warn("Id not found in request parameters", id);
      }
      // params can be undefined, that's why we use the ugly `createRequestParameters` function call
      const params = requestParameters[id] ?? createRequestParameters();

      //   throw new Error("Params not set, this should not happen");

      const result = {} as Pick<T, K>;
      for (const item of items) {
        result[item as K] = params[item] as T[K];
      }

      return result;
    }),
  );
}
