import { useEffect, useMemo } from "react";
import { useApiRoutes } from "../queries";
import { useStudioStore } from "../store";

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

  // TODO - Remove notion of "routes" since this is a holdover from Studio to distinguish between routes and middleware
  const routes = useMemo(() => {
    const routes = routesAndMiddleware?.routes ?? [];
    return routes;
  }, [routesAndMiddleware]);

  // TODO - Remove notion of active routes, since this is a holdover from Studio
  const activeRoutesAndMiddleware = useMemo(() => {
    const activeRoutes = routesAndMiddleware?.routes ?? [];
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
