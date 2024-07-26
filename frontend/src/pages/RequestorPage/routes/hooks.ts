import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyValueParameter } from "../KeyValueForm";
import { extractPathParams, mapPathKey } from "../data";
import { PersistedUiState } from "../persistUiState";
import { ProbedRoute, useProbedRoutes } from "../queries";
import { findMatchedRoute } from "./match";

export function useRoutes(browserHistoryState?: PersistedUiState) {
  // NOTE - Not yet in use
  const [draftRoute, setDraftRoute] = useState<ProbedRoute | null>(null);

  const { data: routesAndMiddleware, isLoading, isError } = useProbedRoutes();
  const routes = useMemo(() => {
    const routes =
      routesAndMiddleware?.routes?.filter((r) => r.handlerType === "route") ??
      [];

    // HACK - Only detects a ws route if its path starts with `/ws`
    const wsroutes =
      routesAndMiddleware?.routes
        ?.filter((r) => r.path.startsWith("/ws"))
        ?.map((r) => ({ ...r, isWs: true })) ?? [];

    const routesWithWs = [...routes, ...wsroutes];

    const routesWithDrafts = draftRoute
      ? [draftRoute, ...routesWithWs]
      : routesWithWs;

    return routesWithDrafts;
  }, [routesAndMiddleware, draftRoute]);

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
    setDraftRoute,
  };
}

function useAutoselectInitialRoute({
  isLoading,
  routes,
  preferRoute,
}: {
  isLoading: boolean;
  routes: ProbedRoute[];
  preferRoute?: { path: string; method: string };
}) {
  const preferredAutoselected = findMatchedRoute(
    routes,
    preferRoute?.path,
    preferRoute?.method,
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
    // Short circuit if there's already a selected route
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
