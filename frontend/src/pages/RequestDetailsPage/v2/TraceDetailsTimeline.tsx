import Diamond from "@/assets/Diamond.svg";
import { Badge } from "@/components/ui/badge";
import {
  MizuOrphanLog,
  MizuSpan,
  MizuTraceV2,
  isMizuOrphanLog,
} from "@/queries";
import { cn } from "@/utils";
import { formatDistanceStrict } from "date-fns";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { minimapId } from "../minimapId";

type TraceDetailsTimelineProps = {
  trace: MizuTraceV2;
};

type NormalizedSpan = MizuSpan & {
  normalizedStartTime: number;
  normalizedEndTime: number;
  normalizedDuration: number;
};

type NormalizedOrphanLog = MizuOrphanLog & {
  normalizedTimestamp: number;
};

type MizuTraceV2Normalized = MizuTraceV2 & {
  normalizedWaterfall: NormalizedMizuWaterfall;
};

type NormalizedMizuWaterfall = Array<NormalizedSpan | NormalizedOrphanLog>;

const normalizeWaterfallTimestamps = (
  trace: MizuTraceV2,
): MizuTraceV2Normalized => {
  const minStart = Math.min(
    ...trace.spans.map((span) => new Date(span.start_time).getTime()),
  );
  const maxEnd = Math.max(
    ...trace.spans.map((span) => new Date(span.end_time).getTime()),
  );

  const normalizeSpan = (span: MizuSpan): NormalizedSpan => {
    const startTime = new Date(span.start_time).getTime();
    const endTime = new Date(span.end_time).getTime();
    return {
      ...span,
      normalizedStartTime: (startTime - minStart) / (maxEnd - minStart),
      normalizedEndTime: (endTime - minStart) / (maxEnd - minStart),
      normalizedDuration: (endTime - startTime) / (maxEnd - minStart),
    };
  };

  const normalizeLog = (log: MizuOrphanLog): NormalizedOrphanLog => {
    const timestamp = new Date(log.timestamp).getTime();
    return {
      ...log,
      normalizedTimestamp: (timestamp - minStart) / (maxEnd - minStart),
    };
  };

  const normalizedWaterfall: NormalizedMizuWaterfall = trace.waterfall.map(
    (spanOrLog) => {
      if (isMizuOrphanLog(spanOrLog)) {
        return normalizeLog(spanOrLog);
      }
      return normalizeSpan(spanOrLog);
    },
  );

  return {
    ...trace,
    normalizedWaterfall,
  };
};

export const TraceDetailsTimeline: React.FC<TraceDetailsTimelineProps> = ({
  trace,
}) => {
  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver>();

  const normalizedTrace = useMemo(
    () => normalizeWaterfallTimestamps(trace),
    [trace],
  );

  const timelineEntryIds = useMemo(() => {
    return normalizedTrace.normalizedWaterfall.map((spanOrLog) =>
      timelineId(spanOrLog),
    );
  }, [normalizedTrace]);

  // Scroll timeline entry item into view if it is out of viewport
  // TODO - Check if this breaks on smaller screens?
  useEffect(() => {
    const element = document.querySelector(`[data-toc-id="${activeId}"]`);
    let timeoutId: ReturnType<typeof setTimeout>;

    if (element) {
      timeoutId = setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [activeId]);

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
      const element = document.getElementById(id);
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
    <div className={cn(
      "text-white rounded-lg overflow-y-auto",
      "lg:p-2",
      // NOTE - Likely need explicit height on this to allow for overflow to be scrollable :thinking_face:
      //        I ran into issues because of the stickiness + grid
      //        Problem now is that the portion above is now variable height.
      // "lg:h-[calc(100vh-80px)]"
    )}>
      <h3 className="text-muted-foreground text-sm uppercase mb-4">Timeline</h3>
      <div className="flex flex-col">
        {normalizedTrace.normalizedWaterfall.map((spanOrLog) => (
          <NormalizedWaterfallRow
            key={isMizuOrphanLog(spanOrLog) ? spanOrLog.id : spanOrLog.span_id}
            spanOrLog={spanOrLog}
            activeId={activeId}
          />
        ))}
      </div>
    </div>
  );
};

const NormalizedWaterfallRow: React.FC<{
  spanOrLog: NormalizedSpan | NormalizedOrphanLog;
  activeId: string | null;
}> = ({ spanOrLog, activeId }) => {
  const id = timelineId(spanOrLog);
  const lineWidth = isMizuOrphanLog(spanOrLog)
    ? ""
    : `${spanOrLog.normalizedDuration * 100}%`;
  const lineOffset = isMizuOrphanLog(spanOrLog)
    ? `${spanOrLog.normalizedTimestamp * 100}%`
    : `${spanOrLog.normalizedStartTime * 100}%`;
  const icon = isMizuOrphanLog(spanOrLog)
    ? getTypeIcon("log")
    : getTypeIcon(spanOrLog.kind);
  const isFetch = !isMizuOrphanLog(spanOrLog) && spanOrLog.kind === "CLIENT";
  const isRootRequest =
    !isMizuOrphanLog(spanOrLog) && spanOrLog.kind === "SERVER";
  return (
    <a
      data-toc-id={id}
      className={cn(
        "flex items-center p-2",
        "border-l border-transparent",
        "hover:bg-primary/10 hover:border-blue-400",
        activeId === id && "bg-primary/10 border-blue-400",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${timelineId(spanOrLog)}`}
    >
      <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
      <div className="flex flex-col w-[115px]">
        {isFetch ? (
          <div>
            <Badge
              variant="outline"
              className={cn(
                "lowercase",
                "font-normal",
                "font-mono",
                "rounded",
                "px-1.5",
                "text-xs",
                "bg-orange-950/60 hover:bg-orange-950/60 text-orange-400",
              )}
            >
              {spanOrLog.name}
            </Badge>
          </div>
        ) : isRootRequest ? (
          <div className="font-mono text-sm truncate">{spanOrLog.name}</div>
        ) : (
          <div className="font-mono font-normal text-xs truncate text-gray-200">
            {/* TODO! */}
            log
            {/* {spanOrLog.name} */}
          </div>
        )}
      </div>
      <div className="text-gray-400 flex flex-grow items-center mx-4">
        {isMizuOrphanLog(spanOrLog) ? (
          <div
            className="h-2.5 border-l-2flex items-center min-w-1"
            style={{ marginLeft: lineOffset }}
          >
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
          </div>
        ) : (
          <div
            className="h-2.5 border-l-2 border-r-2 border-blue-500 flex items-center min-w-1"
            style={{ width: lineWidth, marginLeft: lineOffset }}
          >
            <div className="h-0.5 min-w-1 bg-blue-500 w-full"></div>
          </div>
        )}
      </div>
      <div className="ml-auto text-gray-400 text-xs w-[25px]">
        {isMizuOrphanLog(spanOrLog)
          ? ""
          : formatDuration(spanOrLog.start_time, spanOrLog.end_time)}
      </div>
    </a>
  );
};

/**
 * Helper to correlate entries in the timeline with elements on the page
 *
 * Note that the timeline only correlates from its _first_ log.
 * E.g., an "Incoming Request" will link to the Card containing request details,
 * but not the response details (for now, until the UI is updated to show req/res details together)
 */
function timelineId(logOrSpan: MizuOrphanLog | MizuSpan) {
  const log = isMizuOrphanLog(logOrSpan) ? logOrSpan : logOrSpan.logs[0];
  return minimapId(log);
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "request":
    case "SERVER":
      return "";
    case "CLIENT":
    case "fetch":
      return <Diamond className="w-3.5 h-3.5 text-blue-600" />;
    case "log":
      return <Diamond className="w-3.5 h-3.5 text-orange-400" />;
    case "event":
      return "🔹";
    case "db":
      return "🗄️";
    case "response":
      return "🔵";
    default:
      return "🔸";
  }
};

const formatDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60 * 1000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  const duration = formatDistanceStrict(startDate, endDate, {
    unit: "minute",
  });

  return duration
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m");
};
