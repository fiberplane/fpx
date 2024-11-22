import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils";
import type { OpenAPIOperation, OpenAPISchema } from "./openapi";

type RouteDocumentationProps = {
  openApiSpec: OpenAPIOperation;
};

export const RouteDocumentation = memo(function RouteDocumentation({
  openApiSpec,
}: RouteDocumentationProps) {
  const { parameters, requestBody, responses, description, summary } = openApiSpec;

  return (
    <ScrollArea className="h-full px-4">
      <div className="space-y-6 pb-8">
        {/* Description Section */}
        {(summary || description) && (
          <section className="space-y-2">
            {summary && <h3 className="text-lg font-semibold">{summary}</h3>}
            {description && <p className="text-sm text-gray-400">{description}</p>}
          </section>
        )}

        {/* Parameters Section */}
        {parameters && parameters.length > 0 && (
          <section className="space-y-3">
            <h4 className="font-medium">Parameters</h4>
            <div className="space-y-2">
              {parameters.map((param, idx) => (
                <div
                  key={`${param.name}-${idx}`}
                  className="rounded-lg border p-3 bg-card"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{param.name}</span>
                    <Badge variant={param.required ? "default" : "secondary"}>
                      {param.in}
                    </Badge>
                    {param.required && (
                      <Badge variant="destructive">required</Badge>
                    )}
                  </div>
                  {param.description && (
                    <p className="mt-1 text-sm text-gray-400">
                      {param.description}
                    </p>
                  )}
                  {param.schema && (
                    <SchemaViewer schema={param.schema} className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Request Body Section */}
        {requestBody && (
          <section className="space-y-3">
            <h4 className="font-medium">Request Body</h4>
            <div className="space-y-2">
              {Object.entries(requestBody.content).map(([mediaType, content]) => (
                <div key={mediaType} className="rounded-lg border p-3 bg-card">
                  <Badge variant="outline">{mediaType}</Badge>
                  {content.schema && (
                    <SchemaViewer schema={content.schema} className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Responses Section */}
        {responses && (
          <section className="space-y-3">
            <h4 className="font-medium">Responses</h4>
            <div className="space-y-2">
              {Object.entries(responses).map(([status, response]) => (
                <div key={status} className="rounded-lg border p-3 bg-card">
                  <div className="flex items-center gap-2">
                    <Badge variant={status.startsWith("2") ? "default" : "secondary"}>
                      {status}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {response.description}
                    </span>
                  </div>
                  {response.content && (
                    <div className="mt-2 space-y-2">
                      {Object.entries(response.content).map(
                        ([mediaType, content]) => (
                          <div key={mediaType}>
                            <Badge variant="outline" className="mb-2">
                              {mediaType}
                            </Badge>
                            {content.schema && (
                              <SchemaViewer schema={content.schema} />
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
  if (!schema.type) {
    return null;
  }

  return (
    <div className={cn("font-mono text-sm", className)}>
      {schema.type === "object" && schema.properties ? (
        <div className="space-y-1">
          {Object.entries(schema.properties).map(([key, prop]) => {
            const propSchema = prop as OpenAPISchema;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-blue-400">{key}</span>
                <span className="text-gray-400">{propSchema.type}</span>
                {schema.required?.includes(key) && (
                  <Badge variant="destructive" className="text-[10px]">
                    required
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-400">
          {schema.type}
          {schema.enum && (
            <span className="ml-2">
              enum: [{schema.enum.join(", ")}]
            </span>
          )}
        </div>
      )}
    </div>
  );
} 