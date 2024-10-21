import { PROBED_ROUTES_KEY } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type ProbedRoute, ProbedRouteSchema } from "../../types";

type ProbedRoutesResponse = {
  baseUrl: string;
  routes: ProbedRoute[];
};

const ProbedRouteResponseSchema = z.object({
  baseUrl: z.string(),
  routes: z.array(ProbedRouteSchema),
});

async function getProbedRoutes(): Promise<ProbedRoutesResponse> {
  const response = await fetch("/v0/app-routes");
  const json = await response.json();
  const result = ProbedRouteResponseSchema.safeParse(json);

  if (!result.success) {
    console.error(
      "Error parsing probed routes response",
      result.error.format(),
    );
  }

  return result.data as ProbedRoutesResponse;
}

export function useProbedRoutes() {
  return useQuery({
    queryKey: [PROBED_ROUTES_KEY],
    queryFn: getProbedRoutes,
  });
}
