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

// HACK - This is a workaround for typing the recursive OpenAPISchemaSchema
//        because I haven't looked up how to do this properly with zod yet.
type OpenAPISchemaTypeExplicit = {
  type?: string;
  description?: string;
  example?: string;
  properties?: Record<string, OpenAPISchemaTypeExplicit>;
  items?: OpenAPISchemaTypeExplicit;
  $ref?: string;
  required?: string[];
  additionalProperties?: boolean;
  allOf?: OpenAPISchemaTypeExplicit[];
  anyOf?: OpenAPISchemaTypeExplicit[];
  oneOf?: OpenAPISchemaTypeExplicit[];
  enum?: (string | number | boolean)[];
};

const OpenAPISchemaSchema: z.ZodType<OpenAPISchemaTypeExplicit> = z.lazy(() =>
  z.object({
    type: z.string().optional(),
    description: z.string().optional(),
    example: z.string().optional(),
    properties: z.record(OpenAPISchemaSchema).optional(),
    items: OpenAPISchemaSchema.optional(),
    $ref: z.string().optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
    allOf: z.array(OpenAPISchemaSchema).optional(),
    anyOf: z.array(OpenAPISchemaSchema).optional(),
    oneOf: z.array(OpenAPISchemaSchema).optional(),
    enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
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

export type OpenApiPathItem = z.infer<typeof OpenApiPathItemSchema>;
export type OpenApiSpec = z.infer<typeof OpenApiSpecSchema>;
export type OpenAPIOperation = z.infer<typeof OpenAPIOperationSchema>;
export type OpenAPIComponents = z.infer<typeof OpenAPIComponentsSchema>;
export type OpenAPISchema = z.infer<typeof OpenAPISchemaSchema>;
export type OpenAPIRequestBody = z.infer<typeof OpenAPIRequestBodySchema>;
