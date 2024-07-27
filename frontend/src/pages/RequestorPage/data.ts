import { useState } from "react";
import { useKeyValueForm } from "./KeyValueForm";
import { PersistedUiState } from "./persistUiState";

export function useRequestorFormData(
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
