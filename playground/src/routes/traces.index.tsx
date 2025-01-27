import { Card, CardContent } from "@/components/ui/card";
import { tracesQueryOptions } from "@/lib/hooks/useTraces";
import { cn } from "@/lib/utils";
import type { Trace } from "@/types";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/traces/")({
  component: TracesOverview,
  loader: async ({ context: { queryClient } }) => {
    const response = await queryClient.ensureQueryData(tracesQueryOptions());
    return { traces: response.data };
  },
  onError: (error) => {
    console.error("Error loading traces", error);
  },
  errorComponent: ErrorBoundary,
});

function ErrorBoundary() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h2 className="mb-2 text-lg font-medium">Error loading traces</h2>
      <p className="text-sm text-muted-foreground">
        Make sure you have a Fiberplane sidecar running
      </p>
    </div>
  );
}

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
