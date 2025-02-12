import { useToast } from "@/components/ui/use-toast";
import { useRefreshRoutesMutation } from "@/queries";
import { useCallback } from "react";
import { useState } from "react";

// Custom hook to delay state changes from true to false
function useDelayedState(
  initialState: boolean,
  delayMs: number,
): [boolean, (value: boolean) => void] {
  const [state, setState] = useState(initialState);

  const setDelayedState = useCallback(
    (newState: boolean) => {
      if (newState) {
        // Immediately set to true
        setState(true);
      } else {
        // Delay setting to false
        setTimeout(() => {
          setState(false);
        }, delayMs);
      }
    },
    [delayMs],
  );

  return [state, setDelayedState];
}

/**
 * Custom hook to refresh app routes side panel manually.
 *
 * @returns {object} An object containing the refreshRoutes function and the isRefreshing state.
 * @returns {Function} refreshRoutes - A function to refresh the app routes.
 * @returns {boolean} isRefreshing - A boolean indicating whether the app routes are currently being refreshed. Stays true for 800ms minimum, to allow for transition animations.
 */
export function useRefreshRoutes() {
  const { toast } = useToast();
  const { mutate: mutateRoutes } = useRefreshRoutesMutation();
  const [isRefreshing, setIsRefreshing] = useDelayedState(false, 800);
  const refreshRoutes = () => {
    // Immediately set isRefreshing to true when starting the refresh
    setIsRefreshing(true);

    mutateRoutes(undefined, {
      onError: (error) => {
        console.error("Failed to refresh app routes", error);
        toast({
          title: "Failed to refresh app routes",
          description: error.message,
          variant: "destructive",
        });
      },
      onSettled: () => {
        // Set isRefreshing to false when the mutation is settled (success or error)
        // This will be delayed by 1 second due to our custom hook
        setIsRefreshing(false);
      },
    });
  };
  return { refreshRoutes, isRefreshing };
}
