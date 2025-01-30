// import { validate } from "@apidevtools/swagger-parser";
import { validate } from "@scalar/openapi-parser";
import { useQuery } from "@tanstack/react-query";
import type { OpenAPI } from "openapi-types";

export function useOpenApiParse(spec: string | undefined) {
  return useQuery({
    queryKey: ["parse-openapi", spec],
    queryFn: async () => {
      if (!spec) {
        return null;
      }

      const parsed = JSON.parse(spec);
      const result = await validate(parsed);
      if (result.errors) {
        throw new Error(result.errors.join("\n"));
      }

      return (result.schema as OpenAPI.Document)
    },
    enabled: !!spec,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
