import { useOpenApiSpec } from "@/lib/hooks/useOpenApiSpec";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useStudioStore } from "../../store";
import { getApiRoutesFromOpenApiSpec } from "./fiberplane-embedded";

const API_ROUTES_KEY = "api-routes";

export function useApiRoutes() {
  const { useMockApiSpec } = useStudioStore("useMockApiSpec");
  const { openapi } = useRouteContext({ from: "__root__" });
  const { data: content } = useOpenApiSpec(openapi);

  return useQuery({
    queryKey: [API_ROUTES_KEY, useMockApiSpec],
    queryFn: () =>
      getApiRoutesFromOpenApiSpec(useMockApiSpec, content ?? ""),
  });
}
