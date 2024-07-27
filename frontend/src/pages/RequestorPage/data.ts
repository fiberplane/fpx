import { useCallback, useState } from "react";
import { KeyValueParameter, useKeyValueForm } from "./KeyValueForm";
import { PersistedUiState } from "./persistUiState";
import { ProbedRoute } from "./queries";
import { findMatchedRoute } from "./routes";

export function useRequestorFormData(
  routes: ProbedRoute[],
  selectedRoute: ProbedRoute | null,
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

  // We want to update form data whenever the user selects a new route from the sidebar
  // It's better to wrap up this "new route selected" behavior in a handler,
  // instead of reacting to changes in the selected route via useEffect
  // This way, we can also handle the case where the user selects a route from the history.
  const handleSelectRoute = useCallback(
    (newRoute: ProbedRoute, pathParams?: KeyValueParameter[]) => {
      if (newRoute) {
        // setRoute(newRoute);
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
    [],
  );

  return {
    path,
    setPath,
    method,
    setMethod,
    // handleMethodChange,
    body,
    setBody,
    queryParams,
    setQueryParams,
    pathParams,
    setPathParams,
    requestHeaders,
    setRequestHeaders,
    // handleSelectRoute,
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
