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

  console.log("openApiSpec", openApiSpec);
  return (
    <ScrollArea className="h-full pb-8">
      <div className="p-2">
        {/* Description Section - Updated styling */}
        {(summary || description) && (
          <section>
            {summary && (
              <h3 className="text-2xl font-semibold text-white mb-2">
                {summary}
              </h3>
            )}
            {description && (
              <p className="text-base leading-relaxed text-gray-300">
                {description}
              </p>
            )}
          </section>
        )}

        {/* Parameters Section - Updated layout */}
        {parameters && parameters.length > 0 && (
          <section className="">
            <SectionHeader>Parameters</SectionHeader>
            <div className="space-y-2">
              {parameters.map((param, idx) => (
                <div
                  key={`${param.name}-${idx}`}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center gap-3">
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
            <SectionHeader>Request Body</SectionHeader>
            <div className="space-y-2">
              {Object.entries(requestBody.content).map(
                ([mediaType, content]) => (
                  <div key={mediaType} className="rounded-lg py-2">
                    <ContentTypeBadge mediaType={mediaType} />
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
          <section className="mt-6">
            <SectionHeader>Responses</SectionHeader>
            <div className="space-y-4 ">
              {Object.entries(responses).map(([status, response]) => (
                <div
                  key={status}
                  className="space-y-2 border-b border-gray-700 pb-4 border-dashed"
                >
                  <div className="flex items-start gap-3">
                    <StatusBadge status={status} />
                    <span className="text-sm text-gray-300">
                      {response.description}
                    </span>
                  </div>
                  {response.content && (
                    <div className="">
                      {Object.entries(response.content).map(
                        ([mediaType, content]) => (
                          <div key={mediaType} className="mt-2">
                            <ContentTypeBadge mediaType={mediaType} />
                            <div className="ml-4">
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
      {schema.type === "object" && schema.properties ? (
        <div className="space-y-4">
          {Object.entries(
            schema.properties as Record<string, OpenAPISchema>,
          ).map(([key, prop]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <ParameterName name={key} />
                <TypeBadge type={prop.type ?? "string"} />
                {schema.required?.includes(key) && <RequiredBadge />}
              </div>
              <div>
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
        <div className="text-gray-400 px-3 py-2 text-sm">
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
    <h4 className="text-lg font-medium text-white mb-2 border-b border-gray-700 pb-1">
      {children}
    </h4>
  );
}

function RequiredBadge() {
  return (
    <Badge
      variant="destructive"
      className="bg-red-900/30 text-red-400 border-none text-xs font-normal font-sans py-1"
    >
      Required
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className="px-2 text-xs bg-gray-800 text-gray-400 border-none font-sans font-normal py-1"
    >
      {type}
    </Badge>
  );
}

function ParameterName({ name }: { name: string }) {
  return (
    <code className="mr-2 py-1 rounded-md text-sm font-sans tracking-wide text-gray-200">
      {name}
    </code>
  );
}

type ParameterDescriptionProps = {
  description: string;
};

function ParameterDescription({ description }: ParameterDescriptionProps) {
  return <p className="text-sm text-gray-400">{description}</p>;
}

type ParameterExampleProps = {
  example: unknown;
};

function ParameterExample({ example }: ParameterExampleProps) {
  return (
    <div className="text-xs">
      <span className="text-gray-500">Example: </span>
      <code className="font-mono bg-gray-800/50 px-1.5 py-0.5 rounded text-gray-400">
        {typeof example === "string" ? `"${example}"` : JSON.stringify(example)}
      </code>
    </div>
  );
}

function ContentTypeBadge({ mediaType }: { mediaType: string }) {
  return (
    <Badge
      variant="outline"
      className="my-1 text-sm text-gray-200 px-0 bg-none font-normal font-mono border-none"
    >
      {mediaType}
    </Badge>
  );
}
