import type {
  OpenAPIOperation,
  OpenAPISchema,
} from "../RequestPanel/RouteDocumentation";
import { extractPathParams } from "./utils";

type FakeDataOutput = {
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  body: unknown;
};

function generateSmartFakeValue(
  schema: OpenAPISchema,
  fieldName: string,
): unknown {
  // Handle array type
  if (schema.type === "array" && schema.items) {
    return [generateSmartFakeValue(schema.items, `${fieldName}Item`)];
  }

  // Handle object type
  if (schema.type === "object" && schema.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      obj[key] = generateSmartFakeValue(propSchema, key);
    }
    return obj;
  }

  // Use example if provided
  if (schema.example !== undefined) {
    return schema.example;
  }

  // Smart heuristics based on field name and type
  const nameLower = fieldName.toLowerCase();

  if (schema.enum) {
    return schema.enum[0];
  }

  switch (schema.type) {
    case "string": {
      // Email heuristics
      if (nameLower.includes("email")) {
        return "user@example.com";
      }
      // UUID/ID heuristics
      if (nameLower.includes("uuid") || nameLower.includes("id")) {
        return "123e4567-e89b-12d3-a456-426614174000";
      }
      // Name heuristics
      if (nameLower.includes("name")) {
        return nameLower.includes("first")
          ? "John"
          : nameLower.includes("last")
            ? "Doe"
            : "John Doe";
      }
      if (nameLower.includes("date") || nameLower.includes("time")) {
        return new Date().toISOString();
      }
      return "test_string";
    }
    case "number":
    case "integer": {
      if (nameLower.includes("year")) {
        return new Date().getFullYear();
      }
      if (nameLower.includes("id")) {
        return Math.floor(Math.random() * 1000) + 1;
      }
      return 42;
    }
    case "boolean":
      return true;
    default:
      return null;
  }
}

export function generateFakeData(
  routeSpec: OpenAPIOperation,
  path: string,
): FakeDataOutput {
  const output: FakeDataOutput = {
    queryParams: {},
    headers: {},
    pathParams: {},
    body: undefined,
  };

  // Handle path parameters
  const pathParamNames = extractPathParams(path);
  const pathParamSpecs =
    routeSpec.parameters?.filter((p) => p.in === "path") || [];

  // Map path parameters to their specs if available
  for (const paramName of pathParamNames) {
    const paramSpec = pathParamSpecs.find((p) => p.name === paramName);
    if (paramSpec?.schema) {
      output.pathParams[paramName] = String(
        generateSmartFakeValue(paramSpec.schema, paramName),
      );
    } else {
      // Fallback if no spec is found - generate based on name
      output.pathParams[paramName] = String(
        generateSmartFakeValue({ type: "string" }, paramName),
      );
    }
  }

  // Handle query and header parameters
  if (routeSpec.parameters) {
    for (const param of routeSpec.parameters) {
      const fakeValue = generateSmartFakeValue(param.schema || {}, param.name);

      if (param.in === "query") {
        output.queryParams[param.name] = String(fakeValue);
      } else if (param.in === "header") {
        output.headers[param.name] = String(fakeValue);
      }
    }
  }

  // Handle request body
  if (
    routeSpec.requestBody?.content &&
    "application/json" in routeSpec.requestBody.content
  ) {
    const bodySchema = routeSpec.requestBody.content["application/json"].schema;
    output.body = generateSmartFakeValue(bodySchema, "root");
  }

  return output;
}

export function transformToFormParams(record: Record<string, string>) {
  return Object.entries(record).map(([key, value]) => ({
    key,
    id: crypto.randomUUID(),
    value,
    enabled: true,
  }));
}

export function transformToFormBody(body: unknown) {
  if (body === undefined) {
    return { type: "json" as const, value: undefined };
  }
  return {
    type: "json" as const,
    value: JSON.stringify(body, null, 2),
  };
}
