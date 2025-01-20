import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SparklesIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStudioStore } from "../store";
// TODO - Use barrel file
import {
  type OpenAPIOperation,
  type OpenAPISchema,
  isOpenApiOperation,
} from "./RouteDocumentation/openapi";

type FakeDataOutput = {
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  body: unknown;
};

type FormParam = {
  key: string;
  id: string;
  value: string;
  enabled: boolean;
};

type FormBody =
  | string
  | { type: "text"; value?: string }
  | { type: "json"; value?: string }
  | {
      value: Array<{
        key: string;
        id: string;
        value:
          | { value: string; type: "text" }
          | { name: string; value: File; type: "file" };
        enabled: boolean;
      }>;
      type: "form-data";
      isMultipart: boolean;
    };

function generateSmartFakeValue(
  schema: OpenAPISchema,
  fieldName: string,
): unknown {
  console.log(
    "Generating smart fake value for field:",
    fieldName,
    "with schema:",
    schema,
  );

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
      // Date heuristics
      if (nameLower.includes("date") || nameLower.includes("time")) {
        return new Date().toISOString();
      }
      return "test_string";
    }
    case "number":
    case "integer": {
      if (nameLower.includes("age")) {
        return 25;
      }
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

function extractPathParams(path: string): string[] {
  const matches = path.match(/:[a-zA-Z][a-zA-Z0-9]*/g) || [];
  return matches.map((param) => param.slice(1)); // Remove the : prefix
}

function generateFakeData(
  routeSpec: OpenAPIOperation,
  path: string,
): FakeDataOutput {
  console.log("Generating fake data for route spec:", routeSpec);

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
  if (routeSpec.requestBody?.content?.["application/json"]?.schema) {
    const bodySchema = routeSpec.requestBody.content["application/json"].schema;
    output.body = generateSmartFakeValue(bodySchema, "root");
  }

  return output;
}

function transformToFormParams(record: Record<string, string>): FormParam[] {
  return Object.entries(record).map(([key, value]) => ({
    key,
    id: crypto.randomUUID(),
    value,
    enabled: true,
  }));
}

function transformToFormBody(body: unknown): FormBody {
  if (body === undefined) {
    return { type: "json", value: undefined };
  }
  return {
    type: "json",
    value: JSON.stringify(body, null, 2),
  };
}

export function Faker() {
  const {
    activeRoute,
    setBody,
    setQueryParams,
    setRequestHeaders,
    setPathParams,
  } = useStudioStore(
    "activeRoute",
    "setBody",
    "setQueryParams",
    "setRequestHeaders",
    "setPathParams",
  );

  const openApiSpec = useMemo(() => {
    try {
      return JSON.parse(activeRoute?.openApiSpec ?? "{}");
    } catch (_e) {
      return null;
    }
  }, [activeRoute?.openApiSpec]);

  const hasDocs = isOpenApiOperation(openApiSpec);

  // TODO - Could eventually move this to be a setter from the store
  const fillInData = useCallback(() => {
    if (!hasDocs || !activeRoute) {
      console.error("No route spec found or parseable");
      window.alert("No route spec found or parseable");
      return;
    }
    const fakeData = generateFakeData(openApiSpec, activeRoute.path);
    console.log("Generated fake data:", fakeData);

    // Transform data to match form state types
    setBody(transformToFormBody(fakeData.body));
    setQueryParams(transformToFormParams(fakeData.queryParams));
    setRequestHeaders(transformToFormParams(fakeData.headers));
    setPathParams(transformToFormParams(fakeData.pathParams));
  }, [
    activeRoute,
    hasDocs,
    openApiSpec,
    setBody,
    setQueryParams,
    setRequestHeaders,
    setPathParams,
  ]);

  useHotkeys("mod+g", fillInData);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="p-2 h-auto hover:bg-transparent transition-colors"
          size="sm"
          onClick={fillInData}
        >
          <SparklesIcon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        Fill in request with fake data
      </TooltipContent>
    </Tooltip>
  );
}
