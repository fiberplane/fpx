import { type OpenApiSpec, OpenApiSpecSchema } from "@fiberplane/fpx-types";

export type { OpenAPIOperation } from "@fiberplane/fpx-types";
export type { OpenAPISchema } from "@fiberplane/fpx-types";

export function isOpenApiSpec(value: unknown): value is OpenApiSpec {
  const result = OpenApiSpecSchema.safeParse(value);
  if (!result.success) {
    console.error(
      "[isOpenApiSpec] Error parsing OpenAPI spec:",
      // JSON.stringify(result.error.format(), null, 2),
      JSON.stringify(result.error.issues, null, 2),
    );
  }
  return result.success;
}
