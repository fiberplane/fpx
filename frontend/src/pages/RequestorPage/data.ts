import { useCallback, useState } from "react";
import { KeyValueParameter, useKeyValueForm } from "./KeyValueForm";
import { PersistedUiState } from "./persistUiState";
import { ProbedRoute } from "./queries";
import { findMatchedRoute, shouldDeselectRoute } from "./routes";

export function useRequestorFormData(
  routes: ProbedRoute[],
  selectedRoute: ProbedRoute | null,
  setRoute: (route: ProbedRoute | null) => void,
  setDraftRoute: React.Dispatch<React.SetStateAction<ProbedRoute | null>>,
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
   * Some additional logic for possibly deselecting the currently selected route from the sidebar,
   * whenever the user updates the url input.
   */
  const handlePathInputChange = useCallback(
    (newPath: string) => {
      if (!selectedRoute) {
        setPath(newPath);
        setPathParams(extractPathParams(newPath).map(mapPathKey));
        return;
      }

      const shouldDeselect =
        selectedRoute && shouldDeselectRoute(selectedRoute.path, newPath);

      setPath(newPath);
      if (shouldDeselect) {
        // Create draft route in side panel or something crazy like that?
        setDraftRoute((currentDraftRoute) =>
          currentDraftRoute
            ? {
                ...currentDraftRoute,
                path: newPath,
                pathParams: extractPathParams(newPath).map(mapPathKey),
              }
            : {
                ...selectedRoute,
                isDraft: true,
                routeOrigin: "custom",
                handler: "",
                handlerType: "route",
                currentlyRegistered: false,
                path: newPath,
                method,
              },
        );
        setPathParams(extractPathParams(newPath).map(mapPathKey));
      }
    },
    [selectedRoute, setDraftRoute, method],
  );

  const handleMethodChange = useCallback(
    (newMethod: string) => {
      const isWs = newMethod === "WS";
      const implicitMethod = isWs ? "GET" : newMethod;
      setMethod(implicitMethod);

      const matchingRoute = findMatchedRoute(
        routes,
        path,
        implicitMethod,
        isWs,
      );
      console.log("matchingRoute", matchingRoute);

      if (matchingRoute) {
        setRoute(matchingRoute);
      } else {
        setDraftRoute({
          path,
          method: implicitMethod,
          isWs,
          handler: "",
          handlerType: "route",
          currentlyRegistered: false,
          routeOrigin: "custom",
          isDraft: true,
        });
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
  const regex = /\/(:[a-zA-Z0-9_-]+)/g;

  const result: Array<string> = [];
  let match;
  let lastIndex = -1;
  while ((match = regex.exec(path)) !== null) {
    // Check if the regex is stuck in an infinite loop
    if (regex.lastIndex === lastIndex) {
      break;
    }
    lastIndex = regex.lastIndex;
    result.push(match[1]);
  }
  return result;
}
