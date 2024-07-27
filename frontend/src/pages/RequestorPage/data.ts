import { useState } from "react";
import { PersistedUiState } from "./persistUiState";

export function useRequestorFormData(
  initialBrowserHistoryState?: PersistedUiState,
) {
  const [body, setBody] = useState<string | undefined>(
    initialBrowserHistoryState?.body,
  );

  return {
    body,
    setBody,
  };
}
