import { useOpenApiSpec } from "@/lib/hooks/useOpenApiSpec";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { getApiRoutesFromOpenApiSpec } from "./fiberplane-embedded";

const API_ROUTES_KEY = "api-routes";

export function useApiRoutes() {
  const { openapi } = useRouteContext({ from: "__root__" });
  const { data: content } = useOpenApiSpec(openapi);

  return useQuery({
    queryKey: [API_ROUTES_KEY],
    queryFn: () => getApiRoutesFromOpenApiSpec(content ?? ""),
  });
}
