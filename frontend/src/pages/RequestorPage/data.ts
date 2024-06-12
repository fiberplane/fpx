import { useState } from "react";
import { useKeyValueForm } from "./KeyValueForm";

export function useRequestorFormData() {
  const [body, setBody] = useState<string | undefined>("");

  const {
    keyValueParameters: queryParams,
    setKeyValueParameters: setQueryParams,
  } = useKeyValueForm();

  const {
    keyValueParameters: requestHeaders,
    setKeyValueParameters: setRequestHeaders,
  } = useKeyValueForm();

  return {
    body,
    setBody,
    queryParams,
    setQueryParams,
    requestHeaders,
    setRequestHeaders,
  };
}
