import { useShallow } from "zustand/react/shallow";
import type { ApiRoute } from "../../types";
import {
  createInitialApiCallData,
  getRouteId,
} from "../slices/requestResponseSlice";
import type { ApiCallData } from "../slices/types";
import { useStudioStoreRaw } from "./useStudioStore";

/**
 * Retrieves specific API call data properties for the current active route from the studio store.
 *
 * This hook extracts the desired keys from the {@link ApiCallData} state associated with the active {@link ApiRoute} route.
 *
 * - Throws an error if there is no active route.
 * - Uses the active route's ID to locate the corresponding API call state.
 * - Logs a warning if the API call data is missing and then initializes it with a default value.
 * - Returns an object containing only the requested properties.
 *
 * Using shallow comparison for state selection helps optimize performance.
 *
 * @param items - The keys of the {@link ApiCallData} to extract from the state.
 */
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

      const result = {} as Pick<T, K>;
      for (const item of items) {
        result[item as K] = params[item] as T[K];
      }

      return result;
    }),
  );
}
