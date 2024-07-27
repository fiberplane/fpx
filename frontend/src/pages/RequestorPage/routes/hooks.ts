import { useCallback, useEffect, useMemo } from "react";
import { ProbedRoute, useProbedRoutes } from "../queries";

type UseRoutesOptions = {
  addRouteIfNotPresent: (route: ProbedRoute) => void;
};

export function useRoutes({ addRouteIfNotPresent }: UseRoutesOptions) {
  const { data: routesAndMiddleware, isLoading, isError } = useProbedRoutes();
  const routes = useMemo(() => {
    const routes =
      routesAndMiddleware?.routes?.filter((r) => r.handlerType === "route") ??
      [];

    return routes;
  }, [routesAndMiddleware]);

  // HACK - Antipattern, add routes to the reducer based off of external changes
  // NOTE - This will only add routes if they don't exist
  useEffect(() => {
    for (const route of routes) {
      addRouteIfNotPresent(route);
    }
  }, [routes, addRouteIfNotPresent]);

  // TODO - Support swapping out base url in UI,
  //        right now you can only change it by modifying FPX_SERVICE_TARGET in the API
  const addBaseUrl = useCallback(
    (path: string, { isWs }: { isWs?: boolean } = {}) => {
      const baseUrl = routesAndMiddleware?.baseUrl ?? "http://localhost:8787";
      const parsedBaseUrl = new URL(baseUrl);
      if (isWs) {
        parsedBaseUrl.protocol = "ws";
      }
      let updatedBaseUrl = parsedBaseUrl.toString();
      if (updatedBaseUrl.endsWith("/")) {
        updatedBaseUrl = updatedBaseUrl.slice(0, -1);
      }
      if (path?.startsWith(updatedBaseUrl)) {
        return path;
      }
      return `${updatedBaseUrl}${path}`;
    },
    [routesAndMiddleware],
  );

  return {
    isError,
    isLoading,
    routes,
    addBaseUrl,
  };
}
