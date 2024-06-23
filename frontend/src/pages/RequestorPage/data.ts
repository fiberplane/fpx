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

  // If there's already a route selected, then its path keys and values should be the default shown
  const selectedRoutePath = selectedRoute?.path;
  const [pathParams, setPathParams] = useState<KeyValueParameter[]>(
    extractPathParams(selectedRoutePath ?? "").map(mapPathKey),
  );

  // Antipatterns ahead!
  //
  // Keeping state (of selected route), then setting it in an effect whenever it changes.
  //
  // Basically, we want to update form data whenever the user
  // selects a new route from the sidebar

  // Update the method and path to the newly selected route
  useEffect(() => {
    if (selectedRoute) {
      setMethod(selectedRoute.method);
      setPath(selectedRoute.path);
      // HACK - This will 1000% break when we allow editing of the url input
      //        Curious how insomnia handles this?
      //
      // TODO - need to fix this for when a route is loaded from history!
      const newPathKeys = extractPathParams(selectedRoute.path);
      setPathParams(newPathKeys.map(mapPathKey));
    }
  }, [selectedRoute]);

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
