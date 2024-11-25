import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "./queries";
import { ProbedRoute } from "@/pages/RequestorPage/types";

export const PROBED_ROUTES_KEY = "appRoutes";

export const refreshAppRoutes = async () => {
  try {
    const response = await fetch("/v0/refresh-app-routes", {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Is your API running?");
    }
  } catch (error) {
    console.error("Failed to refresh app routes", error);
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Unable to contact the Studio backend. Please check your network connection.",
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error");
  }
};

export function useRefreshRoutesMutation() {
  return useMutation({
    mutationFn: refreshAppRoutes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileTreeRoutes"] });
    },
  });
}

type RouteTreeResponse = {
  tree: Array<TreeNode>;
  unmatched: Array<ProbedRoute>;
};

type AppRoute = {
  id: number;
  path: string | null;
  method: string | null;
  handler: string | null;
  handlerType: string | null;
  currentlyRegistered: boolean | null;
  registrationOrder: number | null;
  routeOrigin: "custom" | "discovered" | "open_api" | null;
  openApiSpec: string | null;
  requestType: "http" | "websocket" | null;
};

type AppRouteWithSourceMetadata = AppRoute & {
  fileName: string;
};

type TreeNode = {
  path: string;
  routes: Array<AppRouteWithSourceMetadata>;
  children: TreeNode[];
};

export function useFetchFileTreeRoutes() {
  return useQuery({
    queryKey: ["fileTreeRoutes"],
    queryFn: async () => {
      const response = await fetch("/v0/app-routes-file-tree");
      // TODO: types
      const json = (await response.json()) as RouteTreeResponse;
      return json;
    },
  });
}
