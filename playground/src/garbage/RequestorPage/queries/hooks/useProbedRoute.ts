import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useStudioStore } from "../../store";
import { getProbedRoutesFromOpenApiSpec } from "./fiberplane-embedded";
import { useOpenApiSpec } from "@/lib/hooks/useOpenApiSpec";

const PROBED_ROUTES_KEY = "probed-routes";

export function useProbedRoutes() {
  const { useMockApiSpec } = useStudioStore("useMockApiSpec");
  const { openapi } = useRouteContext({ from: "__root__" });
  const { data: content } = useOpenApiSpec(openapi);

  return useQuery({
    queryKey: [PROBED_ROUTES_KEY, useMockApiSpec],
    queryFn: () =>
      getProbedRoutesFromOpenApiSpec(useMockApiSpec, content ?? ""),
  });
}
