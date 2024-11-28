import { useHandler } from "@fiberplane/hooks";
import { useStudioStore } from ".";
import type { RequestType } from "../types";
import { addBaseUrl, removeBaseUrl } from "./utils";

const addServiceUrlIfBarePath = (
  serviceBaseUrl: string,
  path: string,
  requestType: RequestType,
) => {
  return addBaseUrl(serviceBaseUrl, path, {
    requestType: requestType,
  });
};

export const useServiceBaseUrl = () => {
  const { requestType, serviceBaseUrl } = useStudioStore(
    "requestType",
    "serviceBaseUrl",
  );

  return {
    serviceBaseUrl,
    addServiceUrlIfBarePath: useHandler((path: string) =>
      addServiceUrlIfBarePath(serviceBaseUrl, path, requestType),
    ),
    removeServiceUrlFromPath: useHandler((path: string) => {
      return removeBaseUrl(serviceBaseUrl, path);
    }),
  };
};
