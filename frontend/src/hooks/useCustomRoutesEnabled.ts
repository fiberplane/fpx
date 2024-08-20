import { useSetting } from "@/queries/settings";
import { useMemo } from "react";

/**
 * Hook that reads the user's settings to determine if they have custom routes enabled
 * Defaults to false
 *
 * IMPROVE: Since this is an asynchronous call, we could include some form of "isLoading"
 */
export function useCustomRoutesEnabled() {
  const customRoutesEnabledSetting = useSetting("customRoutesEnabled");
  return useMemo(() => {
    return customRoutesEnabledSetting ?? false;
  }, [customRoutesEnabledSetting]);
}
