import { useCallback, useState } from "react";
import { KeyValueParameter, useKeyValueForm } from "./KeyValueForm";
import { PersistedUiState } from "./persistUiState";
import { ProbedRoute } from "./queries";
import { diffPaths, hasChangedPathParam } from "./routes/diff-paths";

export function useRequestorFormData(
  routes: ProbedRoute[],
  selectedRoute: ProbedRoute | null,
  setRoute: (route: ProbedRoute | null) => void,
  initialBrowserHistoryState?: PersistedUiState,
) {
  const [method, setMethod] = useState<string>(
    initialBrowserHistoryState?.method || selectedRoute?.method || "GET",
  );
  const [path, setPath] = useState<string>(
    initialBrowserHistoryState?.path ?? selectedRoute?.path ?? "/",
  );
  const [body, setBody] = useState<string | undefined>(
    initialBrowserHistoryState?.body,
  );
  const {
    keyValueParameters: queryParams,
    setKeyValueParameters: setQueryParams,
  } = useKeyValueForm(initialBrowserHistoryState?.queryParams);

  // NOTE - Use this to test overflow
  // useEffect(() => {
  //   setQueryParams(
  //     createKeyValueParameters(
  //       Array.from({ length: 30 }).map(() => ({ key: "a", value: "" })),
  //     ),
  //   );
  // }, []);

  const {
    keyValueParameters: requestHeaders,
    setKeyValueParameters: setRequestHeaders,
  } = useKeyValueForm(initialBrowserHistoryState?.requestHeaders);

  // If there's already a route selected, then its path keys and values should be the default shown
  const selectedRoutePath =
    initialBrowserHistoryState?.route?.path ??
    selectedRoute?.path ??
    initialBrowserHistoryState?.path ??
    "";
  const [pathParams, setPathParams] = useState<KeyValueParameter[]>(
    initialBrowserHistoryState?.pathParams ??
      extractPathParams(selectedRoutePath ?? "").map(mapPathKey),
  );

  /**
   * - Check if new path matches selectedRoute
   * - Update pathParams
   * - Update selectedRoute
   *
   * NOTE - This is VERY rudimentary matching logic...
   */
  const handlePathInputChange = useCallback(
    (newPath: string) => {
      if (!selectedRoute) {
        setPath(newPath);
        return;
      }
      const diffParts = diffPaths(selectedRoute?.path, newPath);

      // Nothing changed, so don't change the curretly selected route
      if (diffParts.length === 0) {
        setPath(newPath);
        return;
      }

      if (diffParts.length === 1) {
        const [oldPart, newPart] = diffParts[0];
        if (oldPart && newPart === "") {
          setPath(newPath);
          return;
        }
      }

      // If only one segment changed, and that segment was a path parameter
      // we *might* be able to get away with not setting a new route
      if (hasChangedPathParam(diffParts)) {
        const [oldPart, newPart] = diffParts[0];

        // If the new part is an empty string, it's possible the user is removing then adding a new path param
        // NOTE - if the newPart is undefined, we assume they're just editing the path entirely
        if (newPart === "") {
          setPath(newPath);
          return;
        }
        if (newPart && oldPart?.includes(newPart)) {
          setPath(newPath);
          return;
        }
        if (newPart && !newPart.startsWith(":")) {
          setPath(newPath);
          return;
        }
      }

      // TODO - Create draft route in side panel or something crazy like that?
      setRoute(null);
      setPath(newPath);
      // TODO - Extract new path params
      setPathParams(extractPathParams(newPath).map(mapPathKey));
    },
    [selectedRoute, setRoute],
  );

  const handleMethodChange = useCallback(
    (newMethod: string) => {
      setMethod(newMethod);
      const matchingRoute = routes.find(
        (r) => r.path === path && r.method === newMethod,
      );
      if (matchingRoute) {
        setRoute(matchingRoute);
      } else {
        setRoute(null);
      }
    },
    [routes, path, setRoute],
  );

  // We want to update form data whenever the user selects a new route from the sidebar
  // It's better to wrap up this "new route selected" behavior in a handler,
  // instead of reacting to changes in the selected route via useEffect
  // This way, we can also handle the case where the user selects a route from the history.
  const handleSelectRoute = useCallback(
    (newRoute: ProbedRoute, pathParams?: KeyValueParameter[]) => {
      if (newRoute) {
        setRoute(newRoute);
        setMethod(newRoute.method);
        // Reset the body for GET and HEAD requests
        if (newRoute.method === "GET" || newRoute.method === "HEAD") {
          setBody(undefined);
        }
        setPath(newRoute.path);
        if (pathParams) {
          setPathParams(pathParams);
        } else {
          // HACK - This will 1000% break when we allow editing of the url input
          //        Curious how insomnia handles this?
          //
          // TODO - need to fix this for when a route is loaded from history!
          const newPathKeys = extractPathParams(newRoute.path);
          setPathParams(newPathKeys.map(mapPathKey));
        }
      }
    },
    [setRoute],
  );

  return {
    path,
    setPath,
    handlePathInputChange,
    method,
    setMethod,
    handleMethodChange,
    body,
    setBody,
    queryParams,
    setQueryParams,
    pathParams,
    setPathParams,
    requestHeaders,
    setRequestHeaders,
    handleSelectRoute,
  };
}

export function mapPathKey(key: string) {
  return { key, value: "", id: key, enabled: false };
}

export function extractPathParams(path: string) {
  const regex = /.*\/(:[a-zA-Z]+).*/;

  const result: Array<string> = [];

  const match = regex.exec(path);

  // TODO - Continue matching
  if (match) {
    result.push(match[1]);
  }

  return result;
}
