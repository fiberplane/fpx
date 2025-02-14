import {
  type SupportedMediaTypeObject,
  type SupportedParameterObject,
  type SupportedReferenceObject,
  type SupportedSchemaObject,
  isSupportedParameterObject,
  isSupportedSchemaObject,
} from "@/lib/isOpenApi";
import { z } from "zod";
import { enforceFormDataTerminalDraftParameter } from "../FormDataForm";
import { createFormDataParameter } from "../FormDataForm/data";
import type { FormDataParameter } from "../FormDataForm/types";
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
  const parameters: Array<SupportedParameterObject> = route.parameters ?? [];
  if (route.operation.parameters) {
    parameters.push(
      ...(route.operation.parameters.filter(
        isSupportedParameterObject,
      ) as Array<SupportedParameterObject>),
    );
  }
  // Extract query parameters from OpenAPI spec
  const specQueryParams =
    parameters?.filter((param) => param.in === "query") ?? [];

  // Convert OpenAPI params to KeyValueParameter format
  const openApiQueryParams: KeyValueParameter[] = specQueryParams.map(
    (param) => {
      const value = getStringValueFromSchema(param.schema);
      return {
        id: param.name,
        key: param.name,
        value,
        enabled: param.required || false,
        parameter: param,
      };
    },
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

export function extractFormDataFromOpenApiDefinition(
  mediaType: SupportedMediaTypeObject,
): PlaygroundBody {
  const values: Array<FormDataParameter> = [];

  // // TODO handle examples?
  if (mediaType.schema && isSupportedSchemaObject(mediaType.schema)) {
    const schema = mediaType.schema;
    console.log("schema", schema);
    if (schema.type === "object") {
      if (schema.additionalProperties) {
        console.warn(
          "Additional properties detected, but aren't handled currently",
        );
      }

      const { properties = {} } = schema;
      for (const key of Object.keys(properties)) {
        const propertySchema = properties[key];
        if (!isSupportedSchemaObject(propertySchema)) {
          continue;
        }

        // Const supported types
        const propertySchemaType = propertySchema.type || "";
        if (
          !Array.isArray(propertySchemaType) &&
          ["string", "number", "integer", "boolean"].includes(
            propertySchemaType,
          )
        ) {
          const newParameter = createFormDataParameter(
            key,
            String(propertySchema.default || ""),
          );

          newParameter.enabled = !!schema.required?.includes(key);
          values.push(newParameter);
        }
      }
    }
  }
  // values.push(createFormDataParameter("", ""));

  return {
    type: "form-data",
    isMultipart: true,
    value: enforceFormDataTerminalDraftParameter(values),
  };
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
  mediaType: SupportedMediaTypeObject,
): PlaygroundBody {
  // // FIXME - Just skip modifying file or form data bodies
  // if (currentBody.type === "file" || currentBody.type === "form-data") {
  //   return currentBody;
  // }

  // // If current body is not empty return current body
  // if (currentBody.value?.trim()) {
  //   return currentBody;
  // }

  // const requestBody =
  //   route.operation.requestBody &&
  //   isSupportedRequestBodyObject(route.operation.requestBody)
  //     ? route.operation.requestBody
  //     : undefined;

  // if (requestBody?.content?.["application/json"]?.schema) {
  //   return currentBody;
  // }
  // console.log(
  //   'requestBody?.content?.["application/json"]?.schema',
  //   requestBody?.content?.["application/json"]?.schema,
  // );

  const schema = mediaType.schema;
  // console.log("schema", schema, requestBody?.content);
  if (!schema || !isSupportedSchemaObject(schema)) {
    return currentBody;
  }

  try {
    const sampleBody = generateSampleFromSchema(schema);
    return {
      type: "json",
      value: JSON.stringify(sampleBody, null, 2),
    };
  } catch (error) {
    console.warn("Failed to generate sample body", error);
    return currentBody;
  }
}

function generateSampleFromSchema(
  schema: SupportedSchemaObject,
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

function getValueFromSchema(
  schema: undefined | SupportedSchemaObject | SupportedReferenceObject,
  options: {
    // biome-ignore lint/suspicious/noExplicitAny: openapi supports many different types of values
    defaultValue: any;
    allowDefaultValue: boolean;
    allowExample: boolean;
  },
  // biome-ignore lint/suspicious/noExplicitAny: openapi supports many different types of values
): any {
  if (!schema || !isSupportedSchemaObject(schema)) {
    return options.defaultValue;
  }

  if (options.allowDefaultValue && "default" in schema) {
    return schema.default;
  }

  if (options.allowExample && "example" in schema) {
    return schema.example;
  }

  return options.defaultValue;
}

function getStringValueFromSchema(
  schema: undefined | SupportedSchemaObject | SupportedReferenceObject,
  options: {
    defaultValue: string;
    allowDefaultValue: boolean;
    allowExample: boolean;
  } = {
    defaultValue: "",
    allowDefaultValue: true,
    allowExample: true,
  },
): string {
  return String(getValueFromSchema(schema, options));
}
