import { useEffect, useMemo } from "react";
import { type ProbedRoute, useProbedRoutes } from "../queries";
import { WEBSOCKETS_ENABLED } from "../webSocketFeatureFlag";

type UseRoutesOptions = {
  setRoutes: (routes: ProbedRoute[]) => void;
  setServiceBaseUrl: (serviceBaseUrl: string) => void;
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

export function useRoutes({ setRoutes, setServiceBaseUrl }: UseRoutesOptions) {
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

  // HACK - Antipattern, add serviceBaseUrl to the reducer based off of external changes
  // HACK - Defaults to localhost:8787 if not set
  const serviceBaseUrl =
    routesAndMiddleware?.baseUrl ?? "http://localhost:8787";
  useEffect(() => {
    console.log("setting serviceBaseUrl", serviceBaseUrl);
    setServiceBaseUrl(serviceBaseUrl);
  }, [serviceBaseUrl, setServiceBaseUrl]);

  // HACK - Antipattern, add routes to the reducer based off of external changes
  // NOTE - This will only add routes if they don't exist
  useEffect(() => {
    setRoutes(routes);
  }, [routes, setRoutes]);

  return {
    isError,
    isLoading,
    routes,
  };
}
