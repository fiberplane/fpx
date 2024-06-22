import { useEffect, useState } from "react";
import {
  KeyValueParameter,
  // createKeyValueParameters,
  useKeyValueForm,
} from "./KeyValueForm";
import { ProbedRoute } from "./queries";

export function useRequestorFormData(selectedRoute: ProbedRoute | null) {
  const [method, setMethod] = useState<string>("GET");
  const [path, setPath] = useState<string>("");

  const [body, setBody] = useState<string | undefined>("");

  const {
    keyValueParameters: queryParams,
    setKeyValueParameters: setQueryParams,
  } = useKeyValueForm();

  // TEST - overflow
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
  } = useKeyValueForm();

  // Antipattern ahead!
  //
  // - Keeping state, then setting it in an effect...

  const selectedRoutePath = selectedRoute?.path;

  const [pathParams, setPathParams] = useState<KeyValueParameter[]>(
    extractPathParams(selectedRoutePath ?? "").map(mapPathKey),
  );

  // HACK - This will 1000% break when we allow editing of the url input
  //        Curious how insomnia handles this
  useEffect(() => {
    if (selectedRoutePath) {
      const newPathKeys = extractPathParams(selectedRoutePath);
      setPathParams(newPathKeys.map(mapPathKey));
    }
  }, [selectedRoutePath]);

  return {
    path,
    setPath,
    method,
    setMethod,
    body,
    setBody,
    queryParams,
    setQueryParams,
    pathParams,
    setPathParams,
    requestHeaders,
    setRequestHeaders,
  };
}

function mapPathKey(key: string) {
  return { key, value: "", id: key, enabled: false };
}

function extractPathParams(path: string) {
  const regex = /.*\/(:[a-zA-Z]+).*/;

  const result: Array<string> = [];

  const match = regex.exec(path);

  // TODO - Continue matching
  if (match) {
    result.push(match[1]);
  }

  return result;
}
