import { useShallow } from "zustand/react/shallow";
import { getRouteId } from "../slices/requestResponseSlice";
import { getPreferredAuthorizationId } from "../utils";
import { useStudioStoreRaw } from "./useStudioStore";

export function useCurrentAuthorization() {
  return useStudioStoreRaw(
    useShallow((state) => {
      if (!state.activeRoute) {
        return null;
      }

      const id = getRouteId(state.activeRoute);
      const { apiCallState } = state;
      const params = apiCallState[id];
      const authorizationId = getPreferredAuthorizationId(
        params?.authorizationId ?? null,
        state.authorizations,
      );

      if (authorizationId === "none") {
        return null;
      }

      return (
        state.authorizations.find((auth) => auth.id === authorizationId) || null
      );
    }),
  );
}
