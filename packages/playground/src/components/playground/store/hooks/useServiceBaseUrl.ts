import { useHandler } from "@fiberplane/hooks";
import { addBaseUrl, removeBaseUrl } from "../utils";
import { useStudioStore } from "./useStudioStore";

const addServiceUrlIfBarePath = (serviceBaseUrl: string, path: string) => {
  return addBaseUrl(serviceBaseUrl, path);
};

export const useServiceBaseUrl = () => {
  const { serviceBaseUrl } = useStudioStore("serviceBaseUrl");

  return {
    serviceBaseUrl,
    addServiceUrlIfBarePath: useHandler((path: string) =>
      addServiceUrlIfBarePath(serviceBaseUrl, path),
    ),
    removeServiceUrlFromPath: useHandler((path: string) => {
      return removeBaseUrl(serviceBaseUrl, path);
    }),
  };
};
