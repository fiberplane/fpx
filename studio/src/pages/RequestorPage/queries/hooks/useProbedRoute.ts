import { PROBED_ROUTES_KEY } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import type { ProbedRoute } from "..";

type ProbedRoutesResponse = {
  baseUrl: string;
  routes: ProbedRoute[];
};

function getProbedRoutes(): Promise<ProbedRoutesResponse> {
  return fetch("/v0/app-routes").then((r) => r.json());
}

export function useProbedRoutes() {
  return useQuery({
    queryKey: [PROBED_ROUTES_KEY],
    queryFn: getProbedRoutes,
  });
}
