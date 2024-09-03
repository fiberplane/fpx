import { useHandler } from "@fiberplane/hooks";
import { useShallow } from "zustand/react/shallow";
import { useRequestorStore } from ".";
import { addBaseUrl, removeBaseUrl } from "../reducer/reducer";
import type { RequestType } from "../types";

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
  const { requestType, serviceBaseUrl } = useRequestorStore(
    useShallow(({ requestType, serviceBaseUrl }) => ({
      requestType,
      serviceBaseUrl,
    })),
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
