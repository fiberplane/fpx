import { useSetting } from "@/queries/settings";
import { useMemo } from "react";

/**
 * Hook that reads the user's settings to determine if they proxy requests enabled
 * Defaults to false
 *
 */
export function useProxyRequestsEnabled() {
  const proxyRequestsEnabled = useSetting("proxyRequestsEnabled");
  return useMemo(() => {
    return proxyRequestsEnabled ?? false;
  }, [proxyRequestsEnabled]);
}
