import { useShallow } from "zustand/react/shallow";
import {
  createInitialApiCallData,
  getRouteId,
} from "../slices/requestResponseSlice";
import type { ApiCallData } from "../slices/types";
import { useStudioStoreRaw } from "./useStudioStore";

export function useApiCallData<
  T extends ApiCallData,
  K extends keyof ApiCallData,
>(...items: Array<K>): Pick<T, K> {
  return useStudioStoreRaw(
    useShallow((state) => {
      if (!state.activeRoute) {
        throw new Error("No active route (useApiCallData)");
      }

      const id = getRouteId(state.activeRoute);
      const { apiCallState } = state;

      if (id in apiCallState === false) {
        console.warn("Id not found in request parameters", id);
      }
      // params may be undefined, that's why we use the ugly `createInitialApiCallData` function call
      const params = apiCallState[id] ?? createInitialApiCallData();

      //   throw new Error("Params not set, this should not happen");

      const result = {} as Pick<T, K>;
      for (const item of items) {
        result[item as K] = params[item] as T[K];
      }

      return result;
    }),
  );
}
