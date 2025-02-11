import {
  TimelineListDetails,
  extractWaterfallTimeStats,
} from "@/components/Timeline";
import { type Waterfall, cn } from "@/utils";
import type React from "react";

type TraceDetailsTimelineProps = {
  waterfall: Waterfall;
  className?: string;
};

export const TraceDetailsTimeline: React.FC<TraceDetailsTimelineProps> = ({
  waterfall,
  className,
}) => {
  // NOTE - `duration` could be 0
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);

  return (
    <div
      className={cn("text-white rounded-lg overflow-y-auto", "py-4", className)}
    >
      <h3 className="text-muted-foreground text-sm uppercase mb-4">Timeline</h3>
      <TimelineListDetails
        duration={duration}
        minStart={minStart}
        waterfall={waterfall}
      />
    </div>
  );
};
