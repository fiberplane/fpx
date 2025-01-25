import { useAsWaterfall } from "@/components/Timeline";
import { TimelineListDetails } from "@/components/Timeline";
import { extractWaterfallTimeStats } from "@/components/Timeline/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrphanLogs } from "@/hooks";
import { traceQueryOptions } from "@/lib/hooks/useTraces";
import { cn } from "@/lib/utils";
import type { ApiResponse, OtelEvent, Span, Trace } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/traces/$traceId")({
  validateSearch: z.object({
    spanId: z.string().optional(),
  }),
  component: TraceDetail,
  loader: async ({ context: { queryClient }, params: { traceId } }) => {
    const response = await queryClient.ensureQueryData(
      traceQueryOptions(traceId),
    );
    return { trace: { traceId, spans: response.data } };
  },
});

function TraceDetail() {
  const { trace } = Route.useLoaderData();
  const { traceId, spans } = trace;
  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useAsWaterfall(spans ?? [], orphanLogs);
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);

  if (!trace?.spans || !trace?.spans?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="mb-2 text-lg font-medium">Trace not found</h2>
      </div>
    );
  }

  // const selectedSpan = spanId
  //   ? trace.spans.find((span: Span) => span.span_id === spanId)
  //   : trace.spans[0];

  // if (!selectedSpan) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-full p-4">
  //       <h2 className="mb-2 text-lg font-medium">Span not found</h2>
  //     </div>
  //   );
  // }

  if (waterfall?.length) {
    return (
      <TimelineListDetails
        waterfall={waterfall}
        minStart={minStart}
        duration={duration}
      />
    );
  }

  // HACK - Old claude UI

  return (
    <div
      className={cn(
        "grid h-full gap-4",
        trace?.spans?.length > 1 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      <div className="h-full p-4 overflow-auto border rounded-md">
        <div className="grid items-center justify-between mb-6">
          <div className="grid gap-1">
            <h2 className="text-2xl font-medium">Trace Details</h2>
            <p className="text-sm text-foreground">Trace ID: {trace.traceId}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSpan.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Kind</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSpan.kind}
                </p>
              </div>
              {selectedSpan.status && (
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSpan.status.message} (Code:{" "}
                    {selectedSpan.status.code})
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSpan.start_time.toLocaleString()} -{" "}
                  {selectedSpan.end_time.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {Object.entries(selectedSpan.attributes).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium">{key}</p>
                    <p className="text-sm text-muted-foreground">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedSpan.events?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {selectedSpan.events.map(
                    (event: OtelEvent, index: number) => (
                      <div key={index} className="grid gap-2">
                        <div>
                          <p className="text-sm font-medium">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                        {Object.entries(event.attributes).length > 0 && (
                          <div className="pl-4 border-l">
                            {Object.entries(event.attributes).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="grid grid-cols-2 gap-2"
                                >
                                  <p className="text-sm font-medium">{key}:</p>
                                  <p className="text-sm text-muted-foreground">
                                    {String(value)}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSpan.resource_attributes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resource Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {Object.entries(selectedSpan.resource_attributes).map(
                    ([key, value]) => (
                      <div key={key}>
                        <p className="text-sm font-medium">{key}</p>
                        <p className="text-sm text-muted-foreground">
                          {String(value)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {trace.spans.length > 1 && (
        <div className="h-full p-4 overflow-auto border rounded-md">
          <div className="grid items-center justify-between mb-6">
            <div className="grid gap-1">
              <h2 className="text-2xl font-medium">Spans</h2>
              <p className="text-sm text-muted-foreground">
                {trace.spans.length} spans in this trace
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {trace.spans.map((span: Span) => (
              <Card
                key={span.span_id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  span.span_id === selectedSpan.span_id &&
                    "ring-2 ring-primary",
                )}
                onClick={() => {
                  window.history.pushState({}, "", `?spanId=${span.span_id}`);
                }}
              >
                <CardContent className="p-4">
                  <div className="grid gap-2">
                    <div>
                      <p className="font-medium">{span.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {span.span_id}
                      </p>
                      {span.parent_span_id && (
                        <p className="text-sm text-muted-foreground">
                          Parent: {span.parent_span_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {span.start_time.toLocaleString()}
                      </p>
                      {span.status?.message && (
                        <p className="text-sm font-medium">
                          {span.status.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
