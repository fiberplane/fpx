import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { tracesQueryOptions } from "@/lib/hooks/useTraces";
import { cn } from "@/lib/utils";
import type { Trace } from "@/types";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/traces/")({
  component: TracesOverview,
  loader: async ({ context: { queryClient, fpxEndpoint } }) => {
    const response = await queryClient.ensureQueryData(
      tracesQueryOptions(fpxEndpoint ?? ""),
    );
    return { traces: response.data };
  },
  onError: (error) => {
    console.error("Error loading traces", error);
  },
  errorComponent: ErrorBoundary,
});

function TracesOverview() {
  const loaderData = Route.useLoaderData();
  const { traces } = loaderData;

  if (!traces || traces?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="mb-2 text-lg font-medium">No traces found</h2>
        <p className="text-sm text-muted-foreground">
          Make a request to get started
        </p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      <h2 className="mb-4 text-lg font-medium">
        Traces ({traces.length} total)
      </h2>
      <div className="grid gap-4">
        {traces.map((trace: Trace) => {
          const rootSpan = trace.spans[0];
          if (!rootSpan) {
            return null;
          }

          return (
            <Link
              key={trace.traceId}
              to="/traces/$traceId"
              params={{ traceId: trace.traceId }}
              className="block transition-colors hover:no-underline"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <div className="grid gap-1">
                        <p className="font-medium">{rootSpan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {trace.traceId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trace.spans.length} spans
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(rootSpan.start_time).toLocaleString()}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            rootSpan.status?.code === 2 && "text-destructive",
                            rootSpan.status?.code === 1 && "text-green-600",
                          )}
                        >
                          {rootSpan.status?.message}
                        </p>
                      </div>
                    </div>
                    {Object.entries(rootSpan.attributes).length > 0 && (
                      <div className="grid gap-1 pt-2 mt-2 text-sm border-t">
                        {Object.entries(rootSpan.attributes)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="grid grid-cols-2">
                              <p className="font-medium">{key}:</p>
                              <p className="text-muted-foreground">
                                {String(value)}
                              </p>
                            </div>
                          ))}
                        {Object.entries(rootSpan.attributes).length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{Object.entries(rootSpan.attributes).length - 3}{" "}
                            more attributes
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ErrorBoundary(props: {
  error: Error;
}) {
  const { error } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { fpxEndpoint, mountedPath, openapi, parseError } = useMemo(() => {
    try {
      const rootElement = document.getElementById("root");
      if (!rootElement) {
        return {
          fpxEndpoint: null,
          mountedPath: null,
          openapi: null,
          parseError: { message: "Root element not found" },
        };
      }

      const { fpxEndpoint, mountedPath, openapi } = JSON.parse(
        rootElement.dataset.options as string,
      ) as {
        mountedPath: string;
        openapi?: {
          url?: string;
          content?: string;
        };
        fpxEndpoint?: string;
      };

      return {
        fpxEndpoint,
        mountedPath,
        openapi,
        parseError: null,
      };
    } catch (parseError) {
      return {
        fpxEndpoint: null,
        mountedPath: null,
        openapi: null,
        parseError,
      };
    }
  }, []);

  let message = "Make sure you have a Fiberplane sidecar running";
  if (!fpxEndpoint) {
    message = "Fiberplane tracing endpoint is not set";
  } else if (error) {
    message = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h2 className="mb-2 text-lg font-medium">Error loading traces</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex flex-col gap-4 mt-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <span className="text-muted-foreground">Debug Info</span>
            <Icon
              icon="lucide:chevron-down"
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="grid gap-2">
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    FPX_ENDPOINT
                  </p>
                  <code className="text-sm">{fpxEndpoint}</code>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    MOUNTED_PATH
                  </p>
                  <code className="text-sm">{mountedPath}</code>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    OPENAPI
                  </p>
                  <code className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(openapi, null, 2)}
                  </code>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    PARSE_ERROR
                  </p>
                  <code className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(parseError, null, 2)}
                  </code>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
