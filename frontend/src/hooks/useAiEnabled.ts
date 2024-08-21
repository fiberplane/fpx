import { useSetting } from "@/queries/settings";
import { useMemo } from "react";

/**
 * Hook that reads the user's settings to determine if they have AI-functionality enabled
 * Defaults to false
 *
 * IMPROVE: Since this is an asynchronous call, we could include some form of "isLoading"
 */
export function useAiEnabled() {
  const aiEnabled = useSetting("aiEnabled");
  return useMemo(() => {
    return aiEnabled ?? false;
  }, [aiEnabled]);
}
