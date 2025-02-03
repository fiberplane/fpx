import { validate } from "@apidevtools/swagger-parser";
// import { validate } from "@scalar/openapi-parser";
import { useQuery } from "@tanstack/react-query";
// import type { OpenAPI } from "openapi-types";

export function useOpenApiParse(spec: string | undefined) {
  return useQuery({
    queryKey: ["parse-openapi", spec],
    queryFn: async () => {
      if (!spec) {
        return null;
      }

      const parsed = JSON.parse(spec);
      const result = await validate(parsed);
      return result;
    },
    enabled: !!spec,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
