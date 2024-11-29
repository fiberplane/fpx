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
  // OpenAPIOperationSchema,
  // OpenAPIComponentsSchema,
  // OpenAPISchemaSchema,
  // OpenAPIRequestBodySchema,
};

export const RefCacheSchema = z.map(z.string(), z.unknown());
export type RefCache = z.infer<typeof RefCacheSchema>;

export function isOpenApiSpec(value: unknown): value is OpenApiSpec {
  const result = OpenApiSpecSchema.safeParse(value);
  if (!result.success) {
    logger.error(
      "[isOpenApiSpec] Error parsing truthy OpenAPI spec:",
      // JSON.stringify(result.error.format(), null, 2),
      JSON.stringify(result.error.issues, null, 2),
    );
  }
  return result.success;
}

export function validateReferences(spec: OpenApiSpec): boolean {
  const refs = Array.from(
    spec.components?.schemas ? Object.keys(spec.components.schemas) : [],
  );
  let isValid = true;

  for (const pathItem of Object.values(spec.paths)) {
    for (const operation of Object.values(pathItem)) {
      for (const param of operation.parameters ?? []) {
        if (param.schema?.$ref) {
          const refName = param.schema.$ref.split("/").pop();
          if (refName && !refs.includes(refName)) {
            logger.error(
              `Reference ${param.schema.$ref} not found in components.schemas`,
            );
            isValid = false;
          }
        }
      }

      if (operation.requestBody?.content) {
        for (const content of Object.values(operation.requestBody.content)) {
          if (content.schema?.$ref) {
            const refName = content.schema.$ref.split("/").pop();
            if (refName && !refs.includes(refName)) {
              logger.error(
                `Reference ${content.schema.$ref} not found in components.schemas`,
              );
              isValid = false;
            }
          }
        }
      }

      // Similarly validate responses and other $ref usages
    }
  }

  return isValid;
}
