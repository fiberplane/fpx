import { useAsWaterfall } from "@/components/Timeline";
import { TimelineListDetails } from "@/components/Timeline";
import { extractWaterfallTimeStats } from "@/components/Timeline/utils";
import { useOrphanLogs } from "@/hooks";
import { traceQueryOptions } from "@/lib/hooks/useTraces";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/traces/$traceId")({
  validateSearch: z.object({
    spanId: z.string().optional(),
  }),
  component: TraceDetail,
  loader: async ({
    context: { queryClient, fpxEndpoint },
    params: { traceId },
  }) => {
    const response = await queryClient.ensureQueryData(
      traceQueryOptions(fpxEndpoint ?? "", traceId),
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

  return (
    <div className="overflow-x-hidden h-full">
      <h2 className="text-2xl font-bold mb-2">Request Timeline</h2>
      <TimelineListDetails
        waterfall={waterfall}
        minStart={minStart}
        duration={duration}
      />
    </div>
  );
}
