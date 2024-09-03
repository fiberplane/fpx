import { useShallow } from "zustand/react/shallow";
import { addBaseUrl } from "../reducer/reducer";
import type { RequestType } from "../types";
import { useRequestorStore } from ".";
import { useCallback } from "react";

const addServiceUrlIfBarePath = (
  serviceBaseUrl: string,
  path: string,
  requestType: RequestType,
) => {
  return addBaseUrl(serviceBaseUrl, path, {
    requestType: requestType,
  });
};

export const useAddServiceUrlIfBarePath = () => {
  const { requestType, serviceBaseUrl } = useRequestorStore(
    useShallow(({ requestType, serviceBaseUrl }) => ({
      requestType,
      serviceBaseUrl,
    })),
  );

  return useCallback(
    (path: string) =>
      addServiceUrlIfBarePath(serviceBaseUrl, path, requestType),
    [serviceBaseUrl, requestType],
  );
};
