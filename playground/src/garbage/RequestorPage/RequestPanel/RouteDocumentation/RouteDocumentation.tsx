import { StatusCode } from "@/components/StatusCode";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getHttpMethodTextColor } from "@/utils";
import { ChevronRight } from "lucide-react";
import { memo } from "react";
import type { OpenAPIOperation, OpenAPISchema } from "./openapi";

type OpenAPIParameter = NonNullable<
  NonNullable<OpenAPIOperation["parameters"]>[number]
>;

type RouteDocumentationProps = {
  openApiSpec: OpenAPIOperation;
  route: { path: string; method: string } | null;
};

const getTitleWithFallback = (
  title: string | undefined,
  route: { path: string; method: string } | null,
) => {
  if (title) {
    return title;
  }
  if (!route) {
    return "Untitled";
  }
  return (
    <>
      <span
        className={cn(getHttpMethodTextColor(route.method?.toUpperCase?.()))}
      >
        {route.method}
      </span>
      <span className="ml-1.5">{route.path}</span>
    </>
  );
};

export const RouteDocumentation = memo(function RouteDocumentation({
  openApiSpec,
  route,
}: RouteDocumentationProps) {
  const { parameters, requestBody, responses, description, summary, title } =
    openApiSpec;

  const modTitle = getTitleWithFallback(title, route);

  return (
    <ScrollArea className="h-full pb-8">
      <div className="p-2">
        {(modTitle || summary || description) && (
          <DocsSection>
            {modTitle && (
              <h3 className="text-lg font-semibold text-foreground pb-1 mb-2 border-b">
                {modTitle}
              </h3>
            )}
            {summary && (
              <h3 className="text-lg font-normal text-foreground mb-1">
                {summary}
              </h3>
            )}
            {description && (
              <p className="text-base text-muted-foreground mb-1">
                {description}
              </p>
            )}
          </DocsSection>
        )}

        {/* URL Parameters Section */}
        {parameters && parameters.length > 0 && (
          <DocsSection>
            <SectionHeader>Parameters</SectionHeader>
            <div className="space-y-2">
              {parameters.map((param, idx) => (
                <div
                  key={`${param.name}-${idx}`}
                  className="flex flex-col space-y-2"
                >
                  <DocsParameter
                    name={param?.name}
                    type={getTypeFromParameter(param)}
                    required={param.required ?? false}
                    schema={param.schema}
                    showExample
                    description={param.description}
                  />
                </div>
              ))}
            </div>
          </DocsSection>
        )}

        {/* Request Body Section */}
        {requestBody && (
          <DocsSection>
            {Object.entries(requestBody.content).map(([mediaType, content]) => (
              <div key={mediaType}>
                <SectionHeader>
                  Request Body
                  <ContentTypeBadge mediaType={mediaType} className="ml-auto" />
                </SectionHeader>
                <div className="space-y-2">
                  <div className="rounded-lg py-2">
                    {content.schema && (
                      <SchemaViewer schema={content.schema as OpenAPISchema} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </DocsSection>
        )}

        {/* Responses Section */}
        {responses && (
          <DocsSection>
            <SectionHeader>Responses</SectionHeader>
            <div className="space-y-4 ">
              {Object.entries(responses).map(([status, response]) => (
                <div
                  key={status}
                  className="space-y-2 border-b-2 pb-4 border-dashed"
                >
                  {!response.content && (
                    <div className="">
                      <div className="mt-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <StatusCode status={status} isFailure={false} />
                          </div>
                          <ContentTypeBadge mediaType={"—"} />
                        </div>
                        {/* Commenting this out solely because it looks bad */}
                        {/* {response.description && (
                              <div className="text-sm text-gray-300">
                                {response.description}
                              </div>
                            )} */}
                        <div className="mt-2 pl-3 text-gray-400 text-sm">
                          No Content
                        </div>
                      </div>
                    </div>
                  )}

                  {response.content && (
                    <div className="">
                      {Object.entries(response.content).map(
                        ([mediaType, content]) => (
                          <div key={mediaType} className="mt-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <StatusCode status={status} isFailure={false} />
                              </div>
                              <ContentTypeBadge mediaType={mediaType} />
                            </div>
                            {/* Commenting this out solely because it looks bad */}
                            {/* {response.description && (
                              <div className="text-sm text-gray-300">
                                {response.description}
                              </div>
                            )} */}
                            <div className="mt-2 pl-3">
                              {content.schema && (
                                <SchemaViewer
                                  schema={content.schema as OpenAPISchema}
                                />
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DocsSection>
        )}
      </div>
    </ScrollArea>
  );
});

// Helper functions for type checking
const isArraySchema = (schema: OpenAPISchema): boolean =>
  schema?.type === "array";

const isObjectSchema = (schema: OpenAPISchema): boolean =>
  schema?.type === "object" || !!schema?.properties;

const isPrimitiveArrayItems = (schema: OpenAPISchema): boolean =>
  isArraySchema(schema) &&
  (schema.items as OpenAPISchema)?.type !== "object" &&
  !(schema.items as OpenAPISchema)?.properties;

// Component for rendering array type schemas
type ArraySchemaProps = {
  schema: OpenAPISchema;
};

function ArraySchemaViewer({ schema }: ArraySchemaProps) {
  const itemSchema = schema.items as OpenAPISchema;

  return (
    <div className="space-y-2">
      <Collapsible>
        {/* Array type header - acts as trigger */}
        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded px-2 py-1 group">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-90 transition-transform" />
          <TypeBadge type="array" />
          <span className="text-muted-foreground text-xs">of</span>
          <TypeBadge type={itemSchema.type ?? "object"} />
        </CollapsibleTrigger>

        {/* Array items content - collapsible */}
        <CollapsibleContent>
          <div className="pl-4 border-l-2 mt-2">
            {/* Show array example if it exists */}
            {schema.example && (
              <div className="mb-2">
                <ParameterExample example={schema.example} />
              </div>
            )}

            {isPrimitiveArrayItems(schema) ? (
              // Primitive array items (strings, numbers, etc)
              <>
                {itemSchema.description && (
                  <ParameterDescription
                    description={itemSchema.description as string}
                  />
                )}
                {/* Show item example if no array example exists */}
                {!schema.example && itemSchema.example !== undefined && (
                  <ParameterExample example={itemSchema.example} />
                )}
              </>
            ) : (
              // Object array items
              <>
                <div className="text-muted-foreground text-xs mb-2">
                  Array items:
                </div>
                <SchemaViewer schema={itemSchema} />
                {/* Show item example if no array example exists */}
                {!schema.example && itemSchema.example !== undefined && (
                  <div className="mt-2">
                    <div className="text-muted-foreground text-xs mb-1">
                      Example item:
                    </div>
                    <ParameterExample example={itemSchema.example} />
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Component for rendering object type schemas
type ObjectSchemaProps = {
  schema: OpenAPISchema;
};

function ObjectSchemaViewer({ schema }: ObjectSchemaProps) {
  // Handle objects with additionalProperties but no defined properties
  if (!schema.properties && schema.additionalProperties) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground text-xs">
          Object with additional properties of type:{" "}
          {typeof schema.additionalProperties === "object"
            ? ((schema.additionalProperties as OpenAPISchema).type ?? "any")
            : "any"}
        </div>
        {schema.example && <ParameterExample example={schema.example} />}
      </div>
    );
  }

  // Handle objects with no properties defined
  if (!schema.properties) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground text-xs">Object type</div>
        {schema.example && <ParameterExample example={schema.example} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, prop]) => (
        <div key={key} className="space-y-1">
          {/* Property name and type */}
          <DocsParameter
            name={key}
            type={
              prop.type === "array"
                ? `array of ${(prop.items as OpenAPISchema)?.type ?? "object"}`
                : (prop.type ?? "string")
            }
            required={schema.required?.includes(key) ?? false}
            schema={prop}
            showExample={false}
          />

          {/* Property details */}
          <div className="flex flex-col space-y-1">
            {prop.description && (
              <ParameterDescription description={prop.description} />
            )}
            {/* Handle nested arrays */}
            {prop.type === "array" &&
              prop.items &&
              (isArraySchema(prop) && isPrimitiveArrayItems(prop) ? (
                <ParameterExample example={prop.example} />
              ) : (
                <SchemaViewer schema={prop} />
              ))}
            {/* Handle non-array properties */}
            {prop.type !== "array" && prop.example !== undefined && (
              <ParameterExample example={prop.example} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component for rendering primitive type schemas
type PrimitiveSchemaProps = {
  schema: OpenAPISchema;
};

function PrimitiveSchemaViewer({ schema }: PrimitiveSchemaProps) {
  return (
    <div className="text-muted-foreground px-3 py-2 text-sm">
      {/* Type and enum information */}
      <div className="flex items-center gap-2">
        <code className="text-xs px-1.5 py-0.5 rounded-md bg-primary/75 text-primary-foreground">
          {schema.type}
        </code>
        {schema.enum && (
          <span className="text-foreground text-xs">
            enum: [{schema.enum.join(", ")}]
          </span>
        )}
      </div>

      {/* Description and example */}
      {(schema.description || schema.example !== undefined) && (
        <div className="mt-2 text-xs">
          {schema.description && (
            <ParameterDescription description={schema.description} />
          )}
          {schema.example !== undefined && (
            <ParameterExample example={schema.example} />
          )}
        </div>
      )}
    </div>
  );
}

// Main schema viewer component that routes to the appropriate sub-component
type SchemaViewerProps = {
  schema: OpenAPISchema;
  className?: string;
};

function SchemaViewer({ schema, className }: SchemaViewerProps) {
  if (!schema || typeof schema !== "object") {
    return null;
  }

  // Debug logging to help diagnose schema type issues
  console.log(
    "Schema type:",
    schema.type,
    "Has properties:",
    !!schema.properties,
    "Is array:",
    isArraySchema(schema),
  );

  return (
    <div className={cn("font-mono text-sm", className)}>
      {isArraySchema(schema) ? (
        <ArraySchemaViewer schema={schema} />
      ) : isObjectSchema(schema) ? (
        <ObjectSchemaViewer schema={schema} />
      ) : (
        <PrimitiveSchemaViewer schema={schema} />
      )}
    </div>
  );
}

function DocsParameter({
  name,
  type,
  required,
  schema,
  showExample,
  description,
}: {
  name: string;
  type: string;
  required: boolean;
  schema?: OpenAPIParameter["schema"];
  showExample?: boolean;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Parameter name and type */}
      <div className="flex items-baseline justify-between">
        <ParameterName name={name} />
        <div className="flex items-baseline gap-3">
          <TypeBadge type={type} />
          {required && <RequiredBadge />}
        </div>
      </div>

      {description && <ParameterDescription description={description} />}

      {/* Enum values */}
      {schema && "enum" in schema && schema.enum && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">Allowed values:</div>
          <div className="flex flex-wrap gap-1.5">
            {schema.enum.map((value) => (
              <code
                key={value}
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded bg-muted",
                  value === schema.default && "ring-1 ring-primary/30",
                )}
              >
                {value}
                {value === schema.default && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    (default)
                  </span>
                )}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Example value */}
      {showExample &&
        schema &&
        "example" in schema &&
        schema.example !== undefined && (
          <div className="mt-1">
            <ParameterExample example={schema.example} />
          </div>
        )}
    </div>
  );
}

/**
 * Get the type (string, int, etc) from a parameter.
 */
function getTypeFromParameter(param: OpenAPIParameter) {
  return (
    (param.schema && "type" in param.schema && param.schema.type) || "string"
  );
}

function DocsSection({ children }: { children: React.ReactNode }) {
  return <section className="mb-6">{children}</section>;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-lg font-medium mb-2 border-b pb-1 flex items-center">
      {children}
    </h4>
  );
}

function RequiredBadge() {
  return (
    <span className="px-0.5 py-0 text-xs text-warning border-none font-normal font-sans">
      required
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="px-0.5 py-0 text-xs text-muted-foreground border-none font-normal font-sans ">
      {type}
    </span>
  );
}

function ParameterName({ name }: { name: string }) {
  return (
    <code className="mr-2 py-0.5 rounded-md text-sm font-sans">{name}</code>
  );
}

type ParameterDescriptionProps = {
  description: string;
};

function ParameterDescription({ description }: ParameterDescriptionProps) {
  return (
    <p className="text-xs text-muted-foreground font-sans">{description}</p>
  );
}

type ParameterExampleProps = {
  example: unknown;
};

function ParameterExample({ example }: ParameterExampleProps) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">Example: </span>
      <code className="font-sans px-1.5 py-0.5 rounded">
        {typeof example === "string" ? `"${example}"` : JSON.stringify(example)}
      </code>
    </div>
  );
}

function ContentTypeBadge({
  mediaType,
  className,
}: {
  mediaType: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "my-1 text-xs text-muted-foreground px-0 bg-none font-normal font-mono border-none",
        className,
      )}
    >
      {mediaType}
    </Badge>
  );
}
