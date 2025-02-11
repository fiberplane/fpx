import { validate } from "@scalar/openapi-parser";
import { useMutation } from "@tanstack/react-query";

export function useOpenApiParse(openApiSpec: string) {
  return useMutation({
    mutationFn: async (openApiSpec: string) => {
      const { valid, schema } = await validate(openApiSpec);
      if (!valid) {
        throw new Error("Invalid OpenAPI spec");
      }
      return schema;
    },
    mutationKey: [openApiSpec],
  });
}
