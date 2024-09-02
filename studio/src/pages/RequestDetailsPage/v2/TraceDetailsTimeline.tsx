import type React from "react";
import {
  TimelineGraph,
  extractWaterfallTimeStats,
} from "@/components/Timeline";
import { type Waterfall, cn } from "@/utils";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TraceDetailsTimelineProps = {
  waterfall: Waterfall;
  className?: string;
};

const timelineId = (spanOrLog: Waterfall[0]) => {
  if ("span" in spanOrLog) {
    return spanOrLog.span.span_id;
  }
  return spanOrLog.id;
};

export const TraceDetailsTimeline: React.FC<TraceDetailsTimelineProps> = ({
  waterfall,
  className,
}) => {
  // NOTE - `duration` could be 0
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);

  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver>();

  const timelineEntryIds = useMemo(() => {
    return waterfall.map((spanOrLog) => timelineId(spanOrLog));
  }, [waterfall]);

  // TODO - We should scroll timeline entries into view if the active one is out of viewport

  const handleObserve = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id);
      }
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserve, {
      // TODO - This might need more tweaking
      rootMargin: "0px 0px -33% 0px",
    });

    const { current: currentObserver } = observer;

    for (const id of timelineEntryIds) {
      const element = document.getElementById(id?.toString() ?? "");
      if (element) {
        currentObserver.observe(element);
      }
    }

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [timelineEntryIds, handleObserve]);

  return (
    <div
      className={cn("text-white rounded-lg overflow-y-auto", "py-4", className)}
    >
      <h3 className="text-muted-foreground text-sm uppercase mb-4">Timeline</h3>
      <TimelineGraph
        activeId={activeId}
        duration={duration}
        minStart={minStart}
        waterfall={waterfall}
      />
    </div>
  );
};
