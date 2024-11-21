import { z } from "zod";

// Create a schema for references
const SchemaRefSchema = z.object({
  $ref: z.string(),
});

// Create a schema for direct type definitions
const SchemaTypeSchema = z.object({
  type: z.string(),
  // ... other schema properties
});

// Combine them with discriminatedUnion or union
const SchemaSchema = z.union([SchemaRefSchema, SchemaTypeSchema]);

// Use this in OpenApiSpecSchema where schema validation is needed
const ContentSchema = z.object({
  schema: SchemaSchema,
});

const OpenAPIParameterSchema = z.object({
  name: z.string(),
  in: z.enum(["query", "header", "path", "cookie"]),
  required: z.boolean().optional(),
  schema: z
    .object({
      type: z.string(),
      format: z.string().optional(),
    })
    .optional(),
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
  responses: z.record(OpenAPIResponseSchema),
  tags: z.array(z.string()).optional(),
});

const OpenAPIComponentsSchema = z.object({
  schemas: z.record(OpenAPISchemaSchema).optional(),
  parameters: z.record(OpenAPIParameterSchema).optional(),
  responses: z.record(OpenAPIResponseSchema).optional(),
  requestBodies: z.record(OpenAPIRequestBodySchema).optional(),
});

// Export schemas if needed
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
  console.log("isOpenApiSpec", result);
  if (!result.success) {
    console.error(
      "isOpenApiSpec ERRORS",
      JSON.stringify(result.error.format(), null, 2),
    );
  }
  return result.success;
}
