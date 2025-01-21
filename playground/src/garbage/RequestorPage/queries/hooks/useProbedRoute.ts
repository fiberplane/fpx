import { useQuery } from "@tanstack/react-query";
import { useStudioStore } from "../../store";
import { getProbedRoutesFromOpenApiSpec } from "./fiberplane-embedded";

const PROBED_ROUTES_KEY = "probed-routes";

export function useProbedRoutes() {
  const { useMockApiSpec } = useStudioStore("useMockApiSpec");

  return useQuery({
    queryKey: [PROBED_ROUTES_KEY, useMockApiSpec],
    queryFn: () => getProbedRoutesFromOpenApiSpec(useMockApiSpec),
  });
}
