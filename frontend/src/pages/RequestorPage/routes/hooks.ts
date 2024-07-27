import { useCallback, useEffect, useMemo, useState } from "react";
import { PersistedUiState } from "../persistUiState";
import { ProbedRoute, useProbedRoutes } from "../queries";
import { findMatchedRoute } from "./match";

type UseRoutesOptions = {
  addRouteIfNotPresent: (route: ProbedRoute) => void;
  browserHistoryState?: PersistedUiState;
};

export function useRoutes({
  addRouteIfNotPresent,
  browserHistoryState,
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

function useAutoselectInitialRoute({
  isLoading,
  routes,
  preferRoute,
}: {
  isLoading: boolean;
  routes: ProbedRoute[];
  preferRoute?: { path: string; method: string; isWs?: boolean };
}) {
  const preferredAutoselected = findMatchedRoute(
    routes,
    preferRoute?.path,
    preferRoute?.method,
    preferRoute?.isWs,
  );

  const [selectedRoute, setSelectedRoute] = useState<ProbedRoute | null>(
    preferredAutoselected ?? null,
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
      const autoselectedRoute = routes.find((r) => r.path === "/") ?? routes[0];
      setSelectedRoute(autoselectedRoute);
      // HACK - Only autoselect with this logic once for initializaiton. There's a better way to do this, just need to refactor things a bit
      setHasAlreadyAutoSelected(true);
    }
  }, [routes, isLoading, selectedRoute, hasAlreadyAutoSelected]);

  return { selectedRoute, setSelectedRoute };
}
