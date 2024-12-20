import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OpenAPIEndpoint {
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    description: string;
    required?: boolean;
    schema?: {
      type: string;
    };
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content: {
      "application/json": {
        schema: OpenAPIRequestBodySchema;
      };
    };
  };
  responses?: Record<
    string,
    {
      description: string;
      content?: {
        "application/json"?: {
          example?: unknown;
        };
      };
    }
  >;
}

interface OpenAPIReference {
  $ref: string;
}

interface OpenAPISchemaProperty {
  type: string;
  description?: string;
  $ref?: string;
}

interface OpenAPISchema {
  type: string;
  properties?: Record<string, OpenAPISchemaProperty>;
  required?: string[];
  $ref?: string;
}

interface OpenAPIRequestBodySchema extends OpenAPISchema {
  $ref?: string;
}

interface OpenAPIComponents {
  schemas: Record<string, OpenAPISchema>;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
  }>;
  paths: Record<string, Record<string, OpenAPIEndpoint>>;
  components: OpenAPIComponents;
}

interface SelectedEndpoint {
  path: string;
  method: string;
  details: OpenAPIEndpoint;
}

async function fetchOpenAPISpec(): Promise<OpenAPISpec> {
  const response = await fetch("http://localhost:6246/doc");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const Route = createFileRoute("/")({
  component: ApiReference,
});

// Add this helper function to get the semantic color for HTTP methods
function getMethodBadgeVariant(method: string) {
  switch (method.toLowerCase()) {
    case "get":
      return "success";
    case "post":
      return "info";
    case "put":
      return "warning";
    case "patch":
      return "brand";
    case "delete":
      return "destructive";
    default:
      return "secondary";
  }
}

function resolveReference(
  ref: string,
  spec: OpenAPISpec,
): OpenAPISchema | null {
  // Example ref: "#/components/schemas/User"
  const parts = ref.split("/");

  if (parts[0] !== "#") {
    return null;
  }

  let current: unknown = spec;

  // Skip the first '#' part
  for (let i = 1; i < parts.length; i++) {
    if (typeof current !== "object" || current === null) {
      return null;
    }

    current = (current as Record<string, unknown>)[parts[i]];

    if (!current) {
      return null;
    }
  }

  if (isOpenAPISchema(current)) {
    return current;
  }

  return null;
}

function isOpenAPISchema(value: unknown): value is OpenAPISchema {
  return (
    typeof value === "object" &&
    value !== null &&
    ("type" in value || "$ref" in value)
  );
}

// Add this component near the top with other interfaces
interface RequestBodyPropertyProps {
  name: string;
  property: OpenAPISchemaProperty;
  required?: boolean;
  spec: OpenAPISpec;
}

function RequestBodyProperty({
  name,
  property,
  required,
  spec,
}: RequestBodyPropertyProps) {
  const resolvedProperty =
    property.$ref && typeof property.$ref === "string"
      ? resolveReference(property.$ref, spec)
      : property;

  if (!resolvedProperty) {
    return null;
  }

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      <div className="col-span-2">
        <div className="font-mono text-sm">{name}</div>
        <div className="mt-1 text-sm text-foreground-muted">
          {resolvedProperty.type}
          {required && (
            <Badge variant="destructive" className="ml-2">
              Required
            </Badge>
          )}
        </div>
      </div>
      <div className="col-span-3 text-sm">
        {"description" in resolvedProperty
          ? resolvedProperty.description
          : undefined}
      </div>
    </div>
  );
}

interface RequestBodySchemaProps {
  schema: OpenAPIRequestBodySchema;
  spec: OpenAPISpec;
}

function RequestBodySchema({ schema, spec }: RequestBodySchemaProps) {
  const resolvedSchema = schema.$ref
    ? resolveReference(schema.$ref, spec)
    : schema;

  if (!resolvedSchema?.properties) {
    return null;
  }

  return (
    <div className="border divide-y rounded-lg border-border divide-border">
      {Object.entries(resolvedSchema.properties).map(([name, property]) => (
        <RequestBodyProperty
          key={name}
          name={name}
          property={property}
          required={resolvedSchema.required?.includes(name)}
          spec={spec}
        />
      ))}
    </div>
  );
}

interface URLParameterProps {
  param: {
    name: string;
    in: string;
    description: string;
    required?: boolean;
    schema?: {
      type: string;
    };
  };
}

function URLParameter({ param }: URLParameterProps) {
  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      <div className="col-span-2">
        <div className="font-mono text-sm">{param.name}</div>
        <div className="mt-1 text-sm text-foreground-muted">
          {param.schema?.type}
          {param.required && (
            <Badge variant="destructive" className="ml-2">
              Required
            </Badge>
          )}
        </div>
      </div>
      <div className="col-span-3 text-sm">{param.description}</div>
    </div>
  );
}

interface URLParametersProps {
  parameters: NonNullable<OpenAPIEndpoint["parameters"]>;
}

function URLParameters({ parameters }: URLParametersProps) {
  const urlParameters = parameters.filter((param) => param.in !== "body");

  if (urlParameters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">URL Parameters</h3>
      <div className="border divide-y rounded-lg border-border divide-border">
        {urlParameters.map((param) => (
          <URLParameter key={`${param.in}-${param.name}`} param={param} />
        ))}
      </div>
    </div>
  );
}

function ApiReference() {
  const {
    data: spec,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["openapi-spec"],
    queryFn: fetchOpenAPISpec,
  });

  const [selectedEndpoint, setSelectedEndpoint] =
    React.useState<SelectedEndpoint | null>(null);

  console.log(selectedEndpoint);

  React.useEffect(() => {
    const firstPath = Object.keys(spec?.paths ?? {})[0];
    if (firstPath) {
      const firstMethod = Object.keys(spec?.paths?.[firstPath] ?? {})[0];
      if (firstMethod && spec?.paths?.[firstPath]?.[firstMethod]) {
        setSelectedEndpoint({
          path: firstPath,
          method: firstMethod,
          details: spec.paths[firstPath][firstMethod],
        });
      }
    }
  }, [spec]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">{(error as Error).message}</div>;
  }

  if (!spec) {
    return null;
  }

  return (
    <div className="p-6 space-y-8 bg-background text-foreground">
      {/* Version and Title */}
      <div className="space-y-4">
        <div className="flex gap-4 text-sm text-foreground-muted">
          <span>{spec.info.version}</span>
          <span>{spec.openapi}</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold">{spec.info.title}</h1>
          <p className="mt-2 text-foreground-muted">{spec.info.description}</p>
        </div>
      </div>

      {/* Base URL Card */}
      <Card className="bg-emphasis border-border">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h2 className="text-sm font-medium uppercase text-foreground-muted">
              BASE URL
            </h2>
            <Input
              value={spec.servers?.[0]?.url || ""}
              readOnly
              className="font-mono bg-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Endpoints List - Column 1 */}
        <div className="col-span-2">
          <h2 className="mb-4 text-xl font-bold">Endpoints</h2>
          <div className="space-y-4">
            {Object.entries(spec.paths).map(([path, methods]) => (
              <div key={path} className="space-y-2">
                <h3 className="text-sm font-medium text-foreground-muted">
                  {path.split("/")[1]?.toUpperCase() || "API"}
                </h3>
                {Object.entries(methods).map(([method, details]) => (
                  <button
                    type="button"
                    key={`${path}-${method}`}
                    onClick={() =>
                      setSelectedEndpoint({ path, method, details })
                    }
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-emphasis transition-colors ${
                      selectedEndpoint?.path === path &&
                      selectedEndpoint?.method === method
                        ? "bg-emphasis"
                        : ""
                    }`}
                  >
                    <Badge
                      variant={getMethodBadgeVariant(method)}
                      className="mr-2 uppercase"
                    >
                      {method}
                    </Badge>
                    <span className="truncate">{details.summary || path}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Documentation - Column 2 */}
        <div className="col-span-6">
          {selectedEndpoint && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedEndpoint.details.summary || selectedEndpoint.path}
                </h2>
                <p className="mt-2 text-foreground-muted">
                  {selectedEndpoint.details.description}
                </p>
              </div>

              {selectedEndpoint.details.parameters && (
                <URLParameters
                  parameters={selectedEndpoint.details.parameters}
                />
              )}

              {/* Request Body */}
              {selectedEndpoint.details.requestBody && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Request Body</h3>
                  {selectedEndpoint.details.requestBody.description && (
                    <p className="text-sm text-foreground-muted">
                      {selectedEndpoint.details.requestBody.description}
                    </p>
                  )}
                  <RequestBodySchema
                    schema={
                      selectedEndpoint.details.requestBody.content[
                        "application/json"
                      ].schema
                    }
                    spec={spec}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Request/Response - Column 3 */}
        <div className="col-span-4">
          {selectedEndpoint && (
            <div className="space-y-6">
              {/* Request Example */}
              <Card className="overflow-hidden border-border bg-neutral-700">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                  <div className="flex items-center gap-2 text-sm text-foreground-subtle">
                    <span>Shell</span>
                    <span>cURL</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-foreground-subtle"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-4 font-mono text-sm bg-neutral-700 text-input">
                  <div className="space-y-2">
                    <div>
                      <span className="text-blue-400">curl</span>{" "}
                      <span className="text-yellow-400">--request</span>{" "}
                      {selectedEndpoint.method.toUpperCase()} \
                    </div>
                    <div>
                      <span className="text-yellow-400"> --url</span>{" "}
                      {spec.servers?.[0]?.url}
                      {selectedEndpoint.path} \
                    </div>
                    <div>
                      <span className="text-yellow-400"> --header</span>{" "}
                      'Content-Type: application/json' \
                    </div>
                    {selectedEndpoint.details.parameters?.some(
                      (p) => p.in === "body",
                    ) && (
                      <>
                        <div>
                          <span className="text-yellow-400"> --data</span> {"{"}
                        </div>
                        {selectedEndpoint.details.parameters
                          ?.filter((p) => p.in === "body")
                          .map((param) => (
                            <div key={param.name}> "{param.name}": "",</div>
                          ))}
                        <div>{"}"}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Response Examples */}
              {selectedEndpoint.details.responses && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Responses</h3>
                  {Object.entries(selectedEndpoint.details.responses).map(
                    ([status, response]) => (
                      <Card key={status} className="border-border">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{status}</Badge>
                            <span className="text-sm text-foreground-muted">
                              {response.description}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-4 bg-input">
                          <pre className="overflow-auto text-sm">
                            {JSON.stringify(
                              response.content?.["application/json"]?.example ||
                                {},
                              null,
                              2,
                            )}
                          </pre>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
