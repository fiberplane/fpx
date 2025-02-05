import { useEffect, useMemo } from "react";
import { useApiRoutes } from "../queries";
import { useStudioStore } from "../store";
import type { ApiRoute } from "../types";

/**
 * Filter the routes that we want to show in the UI
 * For now, only keeps the route if it's either
 * - The upgrade websocket middleware (hacky)
 * - A route handler (NOT middleware)
 */
const filterRoutes = (routes: ApiRoute[]) => {
  return routes.filter((r) => {
    if (r.handlerType === "route") {
      return true;
    }

    return false;
  });
};

/**
 * Filter the routes and middleware that are currently registered.
 */
const filterActive = (routesAndMiddleware: ApiRoute[]) => {
  return routesAndMiddleware.filter((r) => {
    return r.currentlyRegistered;
  });
};

export function useRoutes() {
  const {
    setRoutes,
    setActiveRoute,
    setServiceBaseUrl,
    setRoutesAndMiddleware,
  } = useStudioStore(
    "setRoutes",
    "setActiveRoute",
    "setServiceBaseUrl",
    "setRoutesAndMiddleware",
  );

  const { data: routesAndMiddleware, isLoading, isError } = useApiRoutes();

  const routes = useMemo(() => {
    const routes = filterRoutes(routesAndMiddleware?.routes ?? []);
    return routes;
  }, [routesAndMiddleware]);

  const activeRoutesAndMiddleware = useMemo(() => {
    const activeRoutes = filterActive(routesAndMiddleware?.routes ?? []);
    activeRoutes.sort((a, b) => b.registrationOrder - a.registrationOrder);
    return activeRoutes;
  }, [routesAndMiddleware]);

  // HACK - Antipattern, add serviceBaseUrl to the reducer based off of external changes
  //        Defaults to window.location.origin if not set
  const serviceBaseUrl = routesAndMiddleware?.baseUrl ?? window.location.origin;
  useEffect(() => {
    setServiceBaseUrl(serviceBaseUrl);
  }, [serviceBaseUrl, setServiceBaseUrl]);

  // HACK - Antipattern, add routes to the reducer based off of external changes
  // NOTE - This will only add routes if they don't exist
  useEffect(() => {
    setRoutes(routes);
    if (routes[0]) {
      setActiveRoute(routes[0]);
    }
  }, [routes, setRoutes, setActiveRoute]);

  // HACK - Antipattern, add routes and middleware to the reducer based off of external changes
  useEffect(() => {
    setRoutesAndMiddleware(activeRoutesAndMiddleware);
  }, [activeRoutesAndMiddleware, setRoutesAndMiddleware]);

  return {
    isError,
    isLoading,
  };
}
