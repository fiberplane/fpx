import { useCallback, useEffect, useMemo } from "react";
import { ProbedRoute, useProbedRoutes } from "../queries";
import { RequestType, isWsRequest } from "../types";
import { WEBSOCKETS_ENABLED } from "../webSocketFeatureFlag";

type UseRoutesOptions = {
  setRoutes: (routes: ProbedRoute[]) => void;
};

/**
 * Suuuuper hacky way to check if a route is using the standard Hono
 * boilerplate to upgrade to a websocket connection.
 */
const isUpgradeWebSocketMiddleware = (route: ProbedRoute) => {
  const isMiddleware = route?.handlerType === "middleware";
  const isGet = route?.method === "GET";
  const isWsPath = route?.path?.includes("ws");
  const hasUpgrade = route?.handler?.includes("upgrade");
  const hasWebsocket = route?.handler?.includes("websocket");
  const has101 = route?.handler?.includes("101");
  return (
    isMiddleware && isGet && isWsPath && hasUpgrade && hasWebsocket && has101
  );
};

/**
 * Filter the routes that we want to show in the UI
 * For now, only keeps the route if it's either
 * - The upgrade websocket middleware (hacky)
 * - A route handler (NOT middleware)
 */
const filterRoutes = (routes: ProbedRoute[]) => {
  return routes.filter((r) => {
    if (r.handlerType === "route") {
      return true;
    }
    if (WEBSOCKETS_ENABLED && isUpgradeWebSocketMiddleware(r)) {
      return true;
    }
    return false;
  });
};

export function useRoutes({ setRoutes }: UseRoutesOptions) {
  const { data: routesAndMiddleware, isLoading, isError } = useProbedRoutes();
  const routes = useMemo(() => {
    const routes = filterRoutes(routesAndMiddleware?.routes ?? []);
    // HACK - We change the requestType of the upgrade websocket middleware
    //        to websocket so that the UI can show it as such
    return routes.map((r) =>
      isUpgradeWebSocketMiddleware(r)
        ? {
            ...r,
            requestType: "websocket" as const,
          }
        : r,
    );
  }, [routesAndMiddleware]);

  // HACK - Antipattern, add routes to the reducer based off of external changes
  // NOTE - This will only add routes if they don't exist
  useEffect(() => {
    setRoutes(routes);
  }, [routes, setRoutes]);

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
