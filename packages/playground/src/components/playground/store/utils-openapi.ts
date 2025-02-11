import { z } from "zod";
import { enforceTerminalDraftParameter } from "../KeyValueForm";
import type { ApiRoute } from "../types";
import type { KeyValueParameter, PlaygroundBody } from "./types";

/**
 * Filters query parameters to only include those that are either enabled or have a value
 * Intent is that when you change routes, we auto-clear anything dangling from previous openapi specs
 *
 * @param currentQueryParams - Array of key-value parameters to filter
 * @returns Filtered array of parameters with a terminal draft parameter
 */
export function filterDisabledEmptyQueryParams(
  currentQueryParams: KeyValueParameter[],
) {
  return enforceTerminalDraftParameter(
    currentQueryParams.filter((param) => param.enabled || !!param.value),
  );
}

/**
 * Extracts and merges query parameters from an OpenAPI specification with existing parameters
 *
 * @param currentQueryParams - Current array of key-value parameters
 * @param route - Route object containing OpenAPI specification and path
 * @returns Merged array of parameters with a terminal draft parameter
 */
export function extractQueryParamsFromOpenApiDefinition(
  currentQueryParams: KeyValueParameter[],
  route: ApiRoute,
) {
  if (!route.openApiSpec) {
    return enforceTerminalDraftParameter(currentQueryParams);
  }

  const parsedSpec = safeParseOpenApiSpec(route.openApiSpec, route.path);
  if (!parsedSpec) {
    return enforceTerminalDraftParameter(currentQueryParams);
  }

  // Extract query parameters from OpenAPI spec
  const specQueryParams =
    parsedSpec.parameters?.filter((param) => param.in === "query") ?? [];

  // Convert OpenAPI params to KeyValueParameter format
  const openApiQueryParams: KeyValueParameter[] = specQueryParams.map(
    (param) => ({
      id: param.name,
      key: param.name,
      value: param.schema.example?.toString() ?? "",
      enabled: param.required,
    }),
  );

  // Merge with existing parameters, preferring existing values
  const mergedParams = openApiQueryParams.map((openApiParam) => {
    const existingParam = currentQueryParams.find(
      (p) => p.key === openApiParam.key,
    );
    return existingParam ?? openApiParam;
  });

  // Add any existing parameters that weren't in the OpenAPI spec
  const additionalParams = currentQueryParams.filter(
    (param) => !openApiQueryParams.some((p) => p.key === param.key),
  );

  return enforceTerminalDraftParameter([...mergedParams, ...additionalParams]);
}

// Declare the type first since we're going to have a recursive reference
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type JsonSchemaPropertyType = z.ZodType<any>;

// Then define the schema
const JsonSchemaProperty: JsonSchemaPropertyType = z.object({
  type: z.string(),
  example: z.any().optional(),
  properties: z.record(z.lazy(() => JsonSchemaProperty)).optional(),
  required: z.array(z.string()).optional(),
});

const OpenApiParameterSchema = z.object({
  parameters: z
    .array(
      z.object({
        schema: z.object({
          type: z.string(),
          example: z.any().optional(),
        }),
        required: z.boolean(),
        name: z.string(),
        in: z.enum(["path", "query", "header", "cookie"]),
      }),
    )
    .optional(),
  requestBody: z
    .object({
      content: z.object({
        "application/json": z.object({
          schema: JsonSchemaProperty,
        }),
      }),
    })
    .optional(),
  responses: z.record(z.string(), z.any()).optional(),
});

/**
 * Validates and parses an OpenAPI specification string against a defined schema
 * @param openApiSpec - OpenAPI specification as a JSON string
 * @param routePath - Route path for error logging purposes
 * @returns Parsed OpenAPI specification object or null if parsing fails
 */
function safeParseOpenApiSpec(openApiSpec: string, routePath: string) {
  try {
    const spec = JSON.parse(openApiSpec);
    const parsedSpec = OpenApiParameterSchema.safeParse(spec);
    if (!parsedSpec.success) {
      console.warn(
        `Data in openApiSpec for ${routePath} was not in expected format. Here is the error: ${parsedSpec.error?.format?.()}`,
      );
      return null;
    }
    return parsedSpec.data;
  } catch {
    return null;
  }
}

/**
 * Extracts a sample JSON body from OpenAPI specification if the current body is empty
 *
 * @param currentBody - Current request body content
 * @param route - Route object containing OpenAPI specification
 * @returns Sample JSON body string or the current body if no valid schema found
 */
export function extractJsonBodyFromOpenApiDefinition(
  currentBody: PlaygroundBody,
  route: ApiRoute,
): PlaygroundBody {
  // If no OpenAPI spec exists, return current body
  if (!route.openApiSpec) {
    return currentBody;
  }

  // FIXME - Just skip modifying file or form data bodies
  if (currentBody.type === "file" || currentBody.type === "form-data") {
    return currentBody;
  }

  // If current body is not empty return current body
  if (currentBody.value?.trim()) {
    return currentBody;
  }

  const parsedSpec = safeParseOpenApiSpec(route.openApiSpec, route.path);
  if (!parsedSpec?.requestBody?.content?.["application/json"]?.schema) {
    return currentBody;
  }

  const schema = parsedSpec.requestBody.content["application/json"].schema;
  try {
    const sampleBody = generateSampleFromSchema(schema);
    return {
      type: "json",
      value: JSON.stringify(sampleBody, null, 2),
    };
  } catch (error) {
    console.warn(`Failed to generate sample body for ${route.path}:`, error);
    return currentBody;
  }
}

function generateSampleFromSchema(
  schema: z.infer<typeof JsonSchemaProperty>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
): any {
  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.type === "object" && schema.properties) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const result: Record<string, any> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      result[key] = generateSampleFromSchema(prop);
    }
    return result;
  }

  // Default values for different types
  switch (schema.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    default:
      return null;
  }
}
