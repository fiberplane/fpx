import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils";
import { memo } from "react";
import type { OpenAPIOperation, OpenAPISchema } from "./openapi";

type RouteDocumentationProps = {
  openApiSpec: OpenAPIOperation;
};

export const RouteDocumentation = memo(function RouteDocumentation({
  openApiSpec,
}: RouteDocumentationProps) {
  const { parameters, requestBody, responses, description, summary } =
    openApiSpec;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-8 p-6">
        {/* Description Section */}
        {(summary || description) && (
          <section>
            {summary && (
              <h3 className="text-xl font-semibold text-white mb-2">
                {summary}
              </h3>
            )}
            {description && (
              <p className="text-sm leading-relaxed text-gray-400">
                {description}
              </p>
            )}
          </section>
        )}

        {/* Parameters Section */}
        {parameters && parameters.length > 0 && (
          <section>
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-4">
              Parameters
            </h4>
            <div className="space-y-3">
              {parameters.map((param, idx) => (
                <div
                  key={`${param.name}-${idx}`}
                  className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono text-blue-400/90 font-medium">
                      {param.name}
                    </code>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-700"
                    >
                      {param.in}
                    </Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        required
                      </Badge>
                    )}
                  </div>
                  {param.description && (
                    <p className="text-sm text-gray-400 mb-3">
                      {param.description}
                    </p>
                  )}
                  {param.schema && (
                    <SchemaViewer schema={param.schema as OpenAPISchema} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Request Body Section */}
        {requestBody && (
          <section>
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-4">
              Request Body
            </h4>
            <div className="space-y-3">
              {Object.entries(requestBody.content).map(
                ([mediaType, content]) => (
                  <div
                    key={mediaType}
                    className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4"
                  >
                    <Badge
                      variant="outline"
                      className="mb-3 text-xs border-gray-700"
                    >
                      {mediaType}
                    </Badge>
                    {content.schema && (
                      <SchemaViewer schema={content.schema as OpenAPISchema} />
                    )}
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* Responses Section */}
        {responses && (
          <section>
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-4">
              Responses
            </h4>
            <div className="space-y-3">
              {Object.entries(responses).map(([status, response]) => (
                <div
                  key={status}
                  className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={status} />
                    <span className="text-sm text-gray-400">
                      {response.description}
                    </span>
                  </div>
                  {response.content && (
                    <div className="space-y-4 mt-3">
                      {Object.entries(response.content).map(
                        ([mediaType, content]) => (
                          <div key={mediaType}>
                            <Badge
                              variant="outline"
                              className="mb-2 text-xs border-gray-700"
                            >
                              {mediaType}
                            </Badge>
                            {content.schema && (
                              <SchemaViewer
                                schema={content.schema as OpenAPISchema}
                              />
                            )}
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
      {schema.type === "object" && schema.properties ? (
        <div className="grid gap-2">
          {Object.entries(
            schema.properties as Record<string, OpenAPISchema>,
          ).map(([key, prop]) => (
            <div key={key} className="flex flex-col rounded bg-background/50">
              <div className="flex items-center gap-2 px-3 py-2 border-l-2 border-blue-500/20">
                <span className="text-blue-400/90 font-medium">{key}</span>
                <code className="text-xs px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-400">
                  {prop.type}
                </code>
                {schema.required?.includes(key) && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1">
                    required
                  </Badge>
                )}
              </div>

              {/* Description and Example section */}
              {(prop.description || prop.example !== undefined) && (
                <div className="px-3 py-2 text-xs border-t border-border/10">
                  {prop.description && (
                    <p className="text-gray-400 mb-1.5">{prop.description}</p>
                  )}
                  {prop.example !== undefined && (
                    <div className="flex gap-2 items-center text-gray-500">
                      <span className="text-gray-600">Example:</span>
                      <code className="font-mono bg-gray-800/50 px-1.5 py-0.5 rounded">
                        {typeof prop.example === "string"
                          ? `"${prop.example}"`
                          : JSON.stringify(prop.example)}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 px-3 py-2">
          <div className="flex items-center gap-2">
            <code className="text-xs px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-400">
              {schema.type}
            </code>
            {schema.enum && (
              <span className="text-gray-500 text-xs">
                enum: [{schema.enum.join(", ")}]
              </span>
            )}
          </div>

          {/* Description and Example for non-object types */}
          {(schema.description || schema.example !== undefined) && (
            <div className="mt-2 text-xs">
              {schema.description && (
                <p className="text-gray-400 mb-1.5">{schema.description}</p>
              )}
              {schema.example !== undefined && (
                <div className="flex gap-2 items-center text-gray-500">
                  <span className="text-gray-600">Example:</span>
                  <code className="font-mono bg-gray-800/50 px-1.5 py-0.5 rounded">
                    {typeof schema.example === "string"
                      ? `"${schema.example}"`
                      : JSON.stringify(schema.example)}
                  </code>
                </div>
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
