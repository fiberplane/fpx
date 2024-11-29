import {
  type OpenAPIComponents,
  type OpenAPIOperation,
  type OpenAPIRequestBody,
  type OpenAPISchema,
  type OpenApiPathItem,
  OpenApiPathItemSchema,
  type OpenApiSpec,
  OpenApiSpecSchema,
} from "@fiberplane/fpx-types";
import { z } from "zod";
import logger from "../../logger/index.js";

export {
  type OpenApiPathItem,
  type OpenApiSpec,
  type OpenAPIOperation,
  type OpenAPIComponents,
  type OpenAPISchema,
  type OpenAPIRequestBody,
  OpenApiPathItemSchema,
  OpenApiSpecSchema,
};

export const RefCacheSchema = z.map(z.string(), z.unknown());
export type RefCache = z.infer<typeof RefCacheSchema>;

export function isOpenApiSpec(value: unknown): value is OpenApiSpec {
  const result = OpenApiSpecSchema.safeParse(value);
  if (!result.success) {
    logger.error(
      "[isOpenApiSpec] Error parsing truthy OpenAPI spec:",
      JSON.stringify(result.error.issues, null, 2),
    );
  }
  return result.success;
}
