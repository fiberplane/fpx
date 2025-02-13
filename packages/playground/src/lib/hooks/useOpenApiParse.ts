import { dereference } from "@apidevtools/swagger-parser";
import { useQuery } from "@tanstack/react-query";

export function useOpenApiParse(spec: string | undefined) {
  return useQuery({
    queryKey: ["parse-openapi", spec],
    queryFn: async () => {
      if (!spec) {
        return null;
      }

      const parsed = JSON.parse(spec);
      const result = await dereference(parsed);
      return result;
    },
    enabled: !!spec,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
