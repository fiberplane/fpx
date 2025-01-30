import { validate } from "@apidevtools/swagger-parser";
import { useMutation } from "@tanstack/react-query";

export function useOpenApiParse(openApiSpec: string) {
  return useMutation({
    mutationFn: async (openApiSpec: string) => {
      return await validate(openApiSpec);
    },
    mutationKey: [openApiSpec],
  });
}
