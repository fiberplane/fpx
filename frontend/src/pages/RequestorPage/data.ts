import { useCallback, useState } from "react";
import { useKeyValueForm } from "./KeyValueForm";
import { PersistedUiState } from "./persistUiState";
import { ProbedRoute } from "./queries";
import { findMatchedRoute } from "./routes";

export function useRequestorFormData(
  routes: ProbedRoute[],
  selectedRoute: ProbedRoute | null,
  initialBrowserHistoryState?: PersistedUiState,
) {
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

  return {
    body,
    setBody,
    queryParams,
    setQueryParams,
    requestHeaders,
    setRequestHeaders,
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
