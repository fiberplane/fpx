import { useState } from "react";
import { useKeyValueForm } from "./KeyValueForm";

export function useRequestorFormData() {
  const [method, setMethod] = useState<string>("GET");
  const [path, setPath] = useState<string>("");

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
    path,
    setPath,
    method,
    setMethod,
    body,
    setBody,
    queryParams,
    setQueryParams,
    requestHeaders,
    setRequestHeaders,
  };
}
