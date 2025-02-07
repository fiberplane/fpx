import { useShallow } from "zustand/react/shallow";
import { constructFullPath, getRouteId } from "../slices/requestResponseSlice";
import { useStudioStoreRaw } from "./useStudioStore";

export function useUrlPreview(): string | null {
  return useStudioStoreRaw(
    useShallow((state) => {
      const { activeRoute, serviceBaseUrl, apiCallState } = state;
      if (!state.activeRoute) {
        console.warn("No active route");
        return null;
      }

      const id = getRouteId(state.activeRoute);
      const data = apiCallState[id];

      if (!activeRoute || !data) {
        return null;
      }

      return constructFullPath(serviceBaseUrl, activeRoute, data);
    }),
  );
}
