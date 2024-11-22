import { z } from "zod";

// Create a schema for references
const SchemaRefSchema = z.object({
  $ref: z.string(),
});

// Create a schema for direct type definitions
const SchemaTypeSchema = z.object({
  $ref: z.undefined(),
  type: z.enum(["string", "number", "integer", "boolean", "array", "object"]),
  format: z.string().optional(),
  enum: z.array(z.string()).optional(),
  default: z.any().optional(),
  description: z.string().optional(),
  // Add other relevant OpenAPI schema properties here
});

// Combine them with a union instead of discriminatedUnion
const SchemaSchema = z.union([SchemaRefSchema, SchemaTypeSchema]);

// Use this in OpenApiSpecSchema where schema validation is needed
const ContentSchema = z.object({
  schema: SchemaSchema,
});

const OpenAPIParameterSchema = z.object({
  name: z.string(),
  in: z.enum(["query", "header", "path", "cookie"]),
  // TODO - Path parameters must have "required" set to true
  required: z.boolean().optional(),
  schema: SchemaSchema.optional(),
  description: z.string().optional(),
});

const OpenAPIResponseSchema = z.object({
  description: z.string(),
  content: z.record(ContentSchema).optional(),
});

const OpenAPISchemaSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: z.string().optional(),
    properties: z.record(OpenAPISchemaSchema).optional(),
    items: OpenAPISchemaSchema.optional(),
    $ref: z.string().optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
    allOf: z.array(OpenAPISchemaSchema).optional(),
    anyOf: z.array(OpenAPISchemaSchema).optional(),
    oneOf: z.array(OpenAPISchemaSchema).optional(),
    // Add other complex schema properties as needed
  }),
);

const OpenAPIRequestBodySchema = z.object({
  content: z.record(ContentSchema),
});

const OpenAPIOperationSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(OpenAPIParameterSchema).optional(),
  requestBody: OpenAPIRequestBodySchema.optional(),
  responses: z.record(OpenAPIResponseSchema).refine(
    (responses) => {
      // Check if any status code starts with '2' (i.e., 2xx)
      const has2xx = Object.keys(responses).some((code) =>
        /^2\d{2}$/.test(code),
      );
      // Check if 'default' is present
      const hasDefault = "default" in responses;
      return has2xx || hasDefault;
    },
    {
      message:
        'Responses must include at least a "200" or "default" status code.',
    },
  ),
  tags: z.array(z.string()).optional(),
});

const OpenAPIComponentsSchema = z.object({
  schemas: z.record(OpenAPISchemaSchema).optional(),
  parameters: z.record(OpenAPIParameterSchema).optional(),
  responses: z.record(OpenAPIResponseSchema).optional(),
  requestBodies: z.record(OpenAPIRequestBodySchema).optional(),
  headers: z.record(z.any()).optional(),
  securitySchemes: z.record(z.any()).optional(),
  links: z.record(z.any()).optional(),
  callbacks: z.record(z.any()).optional(),
});

export const OpenApiPathItemSchema = z.record(OpenAPIOperationSchema);
export const OpenApiSpecSchema = z.object({
  paths: z.record(OpenApiPathItemSchema),
  components: OpenAPIComponentsSchema.optional(),
});
export const RefCacheSchema = z.map(z.string(), z.unknown());

export type OpenApiPathItem = z.infer<typeof OpenApiPathItemSchema>;
export type OpenApiSpec = z.infer<typeof OpenApiSpecSchema>;
export type OpenAPIOperation = z.infer<typeof OpenAPIOperationSchema>;
export type OpenAPIComponents = z.infer<typeof OpenAPIComponentsSchema>;
export type OpenAPISchema = z.infer<typeof OpenAPISchemaSchema>;
export type OpenAPIRequestBody = z.infer<typeof OpenAPIRequestBodySchema>;
export type RefCache = z.infer<typeof RefCacheSchema>;

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
