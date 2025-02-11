import { useHandler } from "@fiberplane/hooks";
import type { RequestType } from "../../types";
import { addBaseUrl, removeBaseUrl } from "../utils";
import { useStudioStore } from "./useStudioStore";

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
