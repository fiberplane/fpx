import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getHttpMethodTextColor } from "@/utils";
import { memo } from "react";
import type { OpenAPIOperation, OpenAPISchema } from "./openapi";

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
        className={cn(
          "font-mono",
          // "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
          getHttpMethodTextColor(route.method?.toUpperCase?.()),
        )}
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
          <section className="mb-4">
            {modTitle && (
              <h3 className="text-lg font-semibold text-foreground pb-1 mb-2 border-b">
                {modTitle}
              </h3>
            )}
            {summary && (
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {summary}
              </h3>
            )}
            {description && (
              <p className="text-base leading-relaxed text-muted-foreground mb-1">
                {description}
              </p>
            )}
          </section>
        )}

        {/* URL Parameters Section */}
        {parameters && parameters.length > 0 && (
          <section className="">
            <SectionHeader>Parameters</SectionHeader>
            <div className="space-y-2">
              {parameters.map((param, idx) => (
                <div
                  key={`${param.name}-${idx}`}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-baseline gap-3">
                    <ParameterName name={param.name} />
                    <TypeBadge
                      type={
                        (param.schema &&
                          "type" in param.schema &&
                          param.schema.type) ||
                        "string"
                      }
                    />
                    {param.required && <RequiredBadge />}
                  </div>
                  {param.description && (
                    <ParameterDescription description={param.description} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Request Body Section */}
        {requestBody && (
          <section className="">
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
          </section>
        )}

        {/* Responses Section */}
        {responses && (
          <section className="mt-6">
            <SectionHeader>Responses</SectionHeader>
            <div className="space-y-4 ">
              {Object.entries(responses).map(([status, response]) => (
                <div
                  key={status}
                  className="space-y-2 border-b border-primary/20 pb-4 border-dashed"
                >
                  {!response.content && (
                    <div className="">
                      <div className="mt-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={status} />
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
                                <StatusBadge status={status} />
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
          </section>
        )}
      </div>
    </ScrollArea>
  );
});

type SchemaViewerProps = {
  schema: OpenAPISchema;
  className?: string;
};

function SchemaViewer({ schema, className }: SchemaViewerProps) {
  if (!schema || typeof schema !== "object") {
    return null;
  }

  return (
    <div className={cn("font-mono text-sm", className)}>
      {schema.type === "array" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TypeBadge type="array" />
            <span className="text-gray-400 text-xs">of</span>
            {schema.items && (
              <TypeBadge
                type={(schema.items as OpenAPISchema).type ?? "object"}
              />
            )}
          </div>
          {schema.items && (
            <div className="pl-4 border-l-2 mt-2">
              <div className="text-muted-foreground text-xs mb-2">
                Array items:
              </div>
              <SchemaViewer schema={schema.items as OpenAPISchema} />
            </div>
          )}
        </div>
      ) : schema.type === "object" && schema.properties ? (
        <div className="space-y-4">
          {Object.entries(
            schema.properties as Record<string, OpenAPISchema>,
          ).map(([key, prop]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <ParameterName name={key} />
                <TypeBadge type={prop.type ?? "string"} />
                {schema.required?.includes(key) && <RequiredBadge />}
              </div>
              <div className="flex flex-col space-y-1">
                {prop.description && (
                  <ParameterDescription description={prop.description} />
                )}
                {prop.example !== undefined && (
                  <ParameterExample example={prop.example} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <code className="text-xs px-1.5 py-0.5 rounded-md bg-black text-gray-400">
              {schema.type}
            </code>
            {schema.enum && (
              <span className="text-gray-500 text-xs">
                enum: [{schema.enum.join(", ")}]
              </span>
            )}
          </div>

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
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: "default" | "destructive" | "outline" = "outline";
  let statusClass = "text-gray-400 border-gray-700";

  if (status.startsWith("2")) {
    statusClass = "bg-green-500/10 text-green-400 border-green-800";
  } else if (status.startsWith("4")) {
    statusClass = "bg-orange-500/10 text-orange-400 border-orange-800";
  } else if (status.startsWith("5")) {
    statusClass = "bg-red-500/10 text-red-400 border-red-800";
  }

  return (
    <Badge variant={variant} className={cn("text-xs", statusClass)}>
      {status}
    </Badge>
  );
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
    <span className="px-0.5 py-0 text-xs text-orange-700 border-none font-normal font-sans">
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
    <code className="mr-2 py-0.5 rounded-md text-sm font-sans tracking-wide text-muted-foreground">
      {name}
    </code>
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
      <code className="font-sans text-muted-foreground px-1.5 py-0.5 rounded">
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
