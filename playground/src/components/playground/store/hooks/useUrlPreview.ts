import { useShallow } from "zustand/react/shallow";
import { constructFullPath, getRouteId } from "../slices/requestResponseSlice";
import { useStudioStoreRaw } from "./useStudioStore";

export function useUrlPreview(): string | null {
  return useStudioStoreRaw(
    useShallow((state) => {
      const { activeRoute, serviceBaseUrl, apiCallState } = state;
      const id = getRouteId(state.activeRoute || state);
      const data = apiCallState[id];

      if (!activeRoute || !data) {
        return null;
      }

      return constructFullPath(serviceBaseUrl, activeRoute, data);
    }),
  );
}
