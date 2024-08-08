import { useFetchSettings } from "@/queries";
import { useMemo } from "react";

/**
 * Hook that reads the user's settings to determine if they proxy requests enabled
 * Defaults to false
 *
 */
export function useProxyRequestsEnabled() {
  const { data } = useFetchSettings();
  return useMemo(() => {
    console.log(data);
    return !!data?.content?.proxyRequestsEnabled;
  }, [data]);
}
