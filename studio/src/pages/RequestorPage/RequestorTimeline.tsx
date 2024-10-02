import {
  TimelineListDetails,
  extractWaterfallTimeStats,
} from "@/components/Timeline";
import { useAsWaterfall } from "@/components/Timeline/hooks/useAsWaterfall";
import { useOrphanLogs } from "@/hooks";
import { useOtelTrace } from "@/queries";
import { Icon } from "@iconify/react";

type Props = {
  traceId?: string;
};

export function RequestorTimeline({ traceId = "" }: Props) {
  const { data: spans } = useOtelTrace(traceId);
  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useAsWaterfall(spans ?? [], orphanLogs);
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);

  return (
    <div className="overflow-x-hidden h-full">
      {waterfall.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <TimelineListDetails
          waterfall={waterfall}
          minStart={minStart}
          duration={duration}
        />
      )}
    </div>
  );
}

function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300">
      <div className="p-8 rounded-lg flex flex-col items-center max-w-md text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:align-start-vertical"
            strokeWidth="1px"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">No timeline data found</h2>
        <p className="text-gray-400 mb-4 text-sm">
          There is currently no timeline data to display. This could be because
          no events have been recorded yet, or the trace data is not available.
        </p>
      </div>
    </div>
  );
}
