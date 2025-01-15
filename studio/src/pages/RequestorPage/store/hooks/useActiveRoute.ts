import { memoize } from "proxy-memoize";
import { useShallow } from "zustand/react/shallow";
import { useStudioStoreRaw } from "..";
import { _getActiveRoute } from "../utils";

const getActiveRoute = memoize(_getActiveRoute);

export function useActiveRoute() {
  return useStudioStoreRaw(useShallow(getActiveRoute));
}
