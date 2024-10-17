import { useMutation } from "@tanstack/react-query";

export const PROBED_ROUTES_KEY = "appRoutes";

export const refreshAppRoutes = async () => {
  return await fetch("/v0/refresh-app-routes", {
    method: "POST",
  });
};

export function useRefreshAppRoutes() {
  return useMutation({
    mutationFn: refreshAppRoutes,
  });
}
