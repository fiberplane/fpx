import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyValueParameter } from "./KeyValueForm";
import { extractPathParams, mapPathKey } from "./data";
import { PersistedUiState } from "./persistUiState";
import { ProbedRoute, useProbedRoutes } from "./queries";

export function useRoutes(browserHistoryState?: PersistedUiState) {
  const { data: routesAndMiddleware, isLoading, isError } = useProbedRoutes();
  const routes = useMemo(() => {
    return (
      routesAndMiddleware?.routes?.filter((r) => r.handlerType === "route") ??
      []
    );
  }, [routesAndMiddleware]);

  // TODO - Support swapping out base url in UI,
  //        right now you can only change it by modifying MIZU_SERVICE_TARGET in the API
  const addBaseUrl = useCallback(
    (path: string) => {
      const baseUrl = routesAndMiddleware?.baseUrl ?? "http://localhost:8787";
      if (path?.startsWith(baseUrl)) {
        return path;
      }
      return `${baseUrl}${path}`;
    },
    [routesAndMiddleware],
  );

  // Select the home route if it exists, otherwise fall back to the first route in the list
  const { selectedRoute, setSelectedRoute } = useAutoselectInitialRoute({
    isLoading,
    routes,
    preferRoute: browserHistoryState?.route ?? undefined,
  });

  return {
    isError,
    isLoading,
    routes,
    addBaseUrl,
    selectedRoute,
    setSelectedRoute,
  };
}

export function useAutoselectInitialRoute({
  isLoading,
  routes,
  preferRoute,
}: {
  isLoading: boolean;
  routes?: ProbedRoute[];
  preferRoute?: { path: string; method: string };
}) {
  const preferredAutoselected =
    routes?.find((r) => {
      return r.path === preferRoute?.path && r.method === preferRoute?.method;
    }) ?? null;

  const [selectedRoute, setSelectedRoute] = useState<ProbedRoute | null>(
    preferredAutoselected,
  );

  const [hasAlreadyAutoSelected, setHasAlreadyAutoSelected] = useState(false);

  useEffect(() => {
    // NOTE - We do not do autoselection if there was a selected route previously, and we just transitioned to having a selected route...
    const shouldAutoselectInitialRoute =
      !isLoading &&
      routes?.length &&
      selectedRoute === null &&
      !hasAlreadyAutoSelected;

    if (shouldAutoselectInitialRoute) {
      console.log("Autoselecting route...");
      const autoselectedRoute = routes.find((r) => r.path === "/") ?? routes[0];
      setSelectedRoute(autoselectedRoute);
      // HACK - Only autoselect with this logic once for initializaiton. There's a better way to do this, just need to refactor things a bit
      setHasAlreadyAutoSelected(true);
    }
  }, [routes, isLoading, selectedRoute, hasAlreadyAutoSelected]);

  return { selectedRoute, setSelectedRoute };
}

/**
 * Hacky workaround to re-select a route from the routes list when:
 * - The `selectedRoute` is currently empty (null)
 * - There is an exact match in the routes list for the current path and method from the form
 */
export function useReselectRouteHack({
  routes,
  selectedRoute,
  setSelectedRoute,
  setPathParams,
  path,
  method,
}: {
  routes: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  setSelectedRoute: (route: ProbedRoute | null) => void;
  setPathParams: (pathParams: KeyValueParameter[]) => void;
  path: string;
  method: string;
}) {
  useEffect(() => {
    // Shot circuit if there's already a selected route
    if (selectedRoute) {
      return;
    }

    const newSelectedRoute = routes.find(
      (r) => r.path === path && r.method === method,
    );

    if (newSelectedRoute) {
      setSelectedRoute(newSelectedRoute);
      setPathParams(extractPathParams(path).map(mapPathKey));
    }
  }, [routes, selectedRoute, setSelectedRoute, path, method, setPathParams]);
}
