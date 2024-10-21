import { useMutation } from "@tanstack/react-query";

export const PROBED_ROUTES_KEY = "appRoutes";

export const refreshAppRoutes = async () => {
  try {
    const response = await fetch("/v0/refresh-app-routes", {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Is your API running?");
    }
  } catch (error) {
    console.error("Failed to refresh app routes", error);
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Unable to contact the Studio backend. Please check your network connection.",
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error");
  }
};

export function useRefreshRoutesMutation() {
  return useMutation({
    mutationFn: refreshAppRoutes,
  });
}
