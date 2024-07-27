import { useCallback, useEffect, useMemo } from "react";
import { ProbedRoute, useProbedRoutes } from "../queries";
import { RequestType, isWsRequest } from "../types";

type UseRoutesOptions = {
  addRouteIfNotPresent: (route: ProbedRoute) => void;
  removeRoutesIfNotPresent: (routes: ProbedRoute[]) => void;
};

export function useRoutes({
  addRouteIfNotPresent,
  removeRoutesIfNotPresent,
}: UseRoutesOptions) {
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
    removeRoutesIfNotPresent(routes);
  }, [routes, addRouteIfNotPresent, removeRoutesIfNotPresent]);

  // TODO - Support swapping out base url in UI,
  //        right now you can only change it by modifying FPX_SERVICE_TARGET in the API
  const addBaseUrl = useCallback(
    (
      path: string,
      { requestType }: { requestType: RequestType } = { requestType: "http" },
    ) => {
      const baseUrl = routesAndMiddleware?.baseUrl ?? "http://localhost:8787";
      const parsedBaseUrl = new URL(baseUrl);
      if (isWsRequest(requestType)) {
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
