import { useEffect, useMemo } from "react";
import { useApiRoutes } from "../queries";
import { useStudioStore } from "../store";

export function useRoutes() {
  const { setRoutes, setActiveRoute, setServiceBaseUrl } = useStudioStore(
    "setRoutes",
    "setActiveRoute",
    "setServiceBaseUrl",
  );

  const { data: apiRoutes, isLoading, isError } = useApiRoutes();

  // TODO - Remove notion of "routes" since this is a holdover from Studio to distinguish between routes and middleware
  const routes = useMemo(() => {
    const routes = apiRoutes?.routes ?? [];
    return routes;
  }, [apiRoutes]);

  // HACK - Antipattern, add serviceBaseUrl to the reducer based off of external changes
  //        Defaults to window.location.origin if not set
  const serviceBaseUrl = apiRoutes?.baseUrl ?? window.location.origin;
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

  return {
    isError,
    isLoading,
  };
}
