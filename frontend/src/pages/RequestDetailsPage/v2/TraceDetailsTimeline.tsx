import AnthropicLogo from "@/assets/AnthropicLogo.svg";
import Database from "@/assets/Database.svg";
import Diamond from "@/assets/Diamond.svg";
import HonoLogo from "@/assets/HonoLogo.svg";
import NeonLogo from "@/assets/NeonLogo.svg";
import OpenAiLogo from "@/assets/OpenAILogo.svg";

import { Badge } from "@/components/ui/badge";
import { MizuTraceV2, 
  OtelSpan,
  isMizuOrphanLog } from "@/queries";
import { isMizuFetchSpan, isMizuRootRequestSpan } from "@/queries/traces-v2";
// import {
  // MizuOrphanLog,
  // MizuOrphanLog,
  // MizuSpan,
  // MizuTraceV2,
  // isMizuOrphanLog,
  // isMizuOrphanLog,
// } from "@/queries";
import { cn } from "@/utils";
import { formatDistanceStrict } from "date-fns";
import React, {
  // useCallback,
  // useEffect,
  useMemo,
  // useRef,
  // useState,
} from "react";
import {
  NormalizedOrphanLog,
  NormalizedSpan,
  // normalizeWaterfallTimestamps,
} from "./normalize-traces";
// import { timelineId } from "./timelineId";
import {
  canRenderVendorInfo,
  isAnthropicSpan,
  isNeonSpan,
  isOpenAISpan,
} from "./vendorify-traces";
// import { timelineId } from "./timelineId";

type TraceDetailsTimelineProps = {
  // trace: MizuTraceV2;
  root: OtelSpan;
  spans: Array<OtelSpan>;
  orphanLogs: MizuTraceV2["orphanLogs"];
};

// type NormalizedSpan = MizuSpan & {
//   normalizedStartTime: number;
//   normalizedEndTime: number;
//   normalizedDuration: number;
// };

// type NormalizedOrphanLog = MizuOrphanLog & {
//   normalizedTimestamp: number;
// };

// type MizuTraceV2Normalized = MizuTraceV2 & {
//   normalizedWaterfall: NormalizedMizuWaterfall;
// };

// type NormalizedMizuWaterfall = Array<NormalizedSpan | NormalizedOrphanLog>;

const normalizeWaterfallTimestamps = (
  spans: Array<OtelSpan>,
  orphanLogs: MizuTraceV2["orphanLogs"],
) => {
  const logTimestamps = orphanLogs.map((log) =>
    new Date(log.timestamp).getTime(),
  );

  const minStart = Math.min(
    ...spans.map((span) => new Date(span.start_time).getTime()),
    ...logTimestamps,
  );
  const maxEnd = Math.max(
    ...spans.map((span) => new Date(span.end_time).getTime()),
    ...logTimestamps,
  );

  // const normalizeSpan = (span: MizuSpan): NormalizedSpan => {
  //   const startTime = new Date(span.start_time).getTime();
  //   const endTime = new Date(span.end_time).getTime();
  //   return {
  //     ...span,
  //     normalizedStartTime: (startTime - minStart) / (maxEnd - minStart),
  //     normalizedEndTime: (endTime - minStart) / (maxEnd - minStart),
  //     normalizedDuration: (endTime - startTime) / (maxEnd - minStart),
  //   };
  // };

  // const normalizeLog = (log: MizuOrphanLog): NormalizedOrphanLog => {
  //   const timestamp = new Date(log.timestamp).getTime();
  //   return {
  //     ...log,
  //     normalizedTimestamp: (timestamp - minStart) / (maxEnd - minStart),
  //   };
  // };

  // const normalizedWaterfall: NormalizedMizuWaterfall = trace.waterfall.map(
  //   (spanOrLog) => {
  //     if (isMizuOrphanLog(spanOrLog)) {
  //       return normalizeLog(spanOrLog);
  //     }
  //     return normalizeSpan(spanOrLog);
  //   },
  // );

  return {
    minStart,
    // maxEnd,
    duration: maxEnd - minStart,
  };
  // return {
  // ...trace,
  // normalizedWaterfall,
  // };
};

export const TraceDetailsTimeline: React.FC<TraceDetailsTimelineProps> = ({
  spans,
  orphanLogs,
}) => {
  // const [activeId, setActiveId] = useState<string>("");
  // const observer = useRef<IntersectionObserver>();

  // const normalizedWaterfall = useMemo(
  //   () => normalizeWaterfallTimestamps(trace.waterfall),
  //   [trace],
  // );

  // const timelineEntryIds = useMemo(() => {
  //   return normalizedWaterfall.map((spanOrLog) => timelineId(spanOrLog));
  // }, [normalizedWaterfall]);
  const {
    // maxEnd,
    minStart,
    duration,
  } = normalizeWaterfallTimestamps(spans, orphanLogs);
  // const normalizedTrace = useMemo(
  //   () => normalizeWaterfallTimestamps(trace),
  //   [trace],
  // );

  const combinedData = useMemo(() => {
    return [...spans, ...orphanLogs];
  }, [spans, orphanLogs]);

  const sorted = useMemo(() => {
    return combinedData.sort((a, b) => {
      const timeA = "start_time" in a ? a.start_time : a.timestamp;
      const timeB = "start_time" in b ? b.start_time : b.timestamp;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  }, [combinedData]);

  // const

  // const timelineEntryIds = useMemo(() => {
  //   return normalizedTrace.normalizedWaterfall.map((spanOrLog) =>
  //     timelineId(spanOrLog),
  //   );
  // }, [normalizedTrace]);

  // Scroll timeline entry item into view if it is out of viewport
  // TODO - Check if this breaks on smaller screens?
  // useEffect(() => {
  //   const element = document.querySelector(`[data-toc-id="${activeId}"]`);
  //   let timeoutId: ReturnType<typeof setTimeout>;

  //   if (element) {
  //     timeoutId = setTimeout(() => {
  //       element.scrollIntoView({
  //         behavior: "smooth",
  //         block: "nearest",
  //         inline: "nearest",
  //       });
  //     }, 300);
  //   }

  //   return () => {
  //     if (timeoutId) {
  //       clearTimeout(timeoutId);
  //     }
  //   };
  // }, [activeId]);

  // const handleObserve = useCallback((entries: IntersectionObserverEntry[]) => {
  //   for (const entry of entries) {
  //     if (entry.isIntersecting) {
  //       setActiveId(entry.target.id);
  //     }
  //   }
  // }, []);

  // useEffect(() => {
  //   observer.current = new IntersectionObserver(handleObserve, {
  //     // TODO - This might need more tweaking
  //     rootMargin: "0px 0px -33% 0px",
  //   });

  //   const { current: currentObserver } = observer;

  //   for (const id of timelineEntryIds) {
  //     const element = document.getElementById(id);
  //     if (element) {
  //       currentObserver.observe(element);
  //     }
  //   }

  //   return () => {
  //     if (currentObserver) {
  //       currentObserver.disconnect();
  //     }
  //   };
  // }, [timelineEntryIds, handleObserve]);
  // console.log('sortedSpans', sortedSpans);
  return (
    <div
      className={cn(
        "text-white rounded-lg overflow-y-auto",
        "py-4",
        // NOTE - Likely need explicit height on this to allow for overflow to be scrollable :thinking_face:
        //        I ran into issues because of the stickiness + grid
        //        Problem now is that the portion above is now variable height.
        // "lg:h-[calc(100vh-80px)]"
      )}
    >
      <h3 className="text-muted-foreground text-sm uppercase mb-4">Timeline</h3>
      <div className="flex flex-col">
        {sorted.map((spanOrLog) => {
          if (isMizuOrphanLog(spanOrLog)) {
            // return null;
            return (
              <WaterfallRowLog
                key={spanOrLog.id}
                log={spanOrLog}
                duration={duration}
                startTime={minStart}
              />
            );
          }
          return (
            <WaterfallRowSpan
              key={spanOrLog.span_id}
              span={spanOrLog}
              duration={duration}
              startTime={minStart}
            />
          );
        })}
        {/* {normalizedTrace.normalizedWaterfall.map((spanOrLog) => (
          <NormalizedWaterfallRow
            key={isMizuOrphanLog(spanOrLog) ? spanOrLog.id : spanOrLog.span_id}
            spanOrLog={spanOrLog}
            activeId={activeId}
          />
        ))} */}
      </div>
    </div>
  );
};

// const NormalizedWaterfallRow: React.FC<{
//   spanOrLog: NormalizedSpan | NormalizedOrphanLog;
//   activeId: string | null;
// }> = ({ spanOrLog }) => {
//   const id = timelineId(spanOrLog);
//   const { lineWidth, lineOffset } = useTimelineDimensions(spanOrLog);
//   const title = useTimelineTitle(spanOrLog);
//   const icon = useTimelineIcon(spanOrLog);
//   return (
//     <a
//       data-toc-id={id}
//       className={cn(
//         "flex items-center px-2 py-3",
//         "border-l-2 border-transparent",
//         "hover:bg-primary/10 hover:border-blue-500",
//         // activeId === id && "bg-primary/10 border-blue-500",
//         "transition-all",
//         "cursor-pointer",
//       )}
//       href={`#${span.span_id}`}
//     >
//       <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
//       <div className="flex flex-col w-20 overflow-hidden">{title}</div>
//       <div className="text-gray-400 flex flex-grow items-center mx-4">
//         <div
//           className="h-2.5 border-l-2 border-r-2 border-blue-500 flex items-center min-w-1"
//           style={{ width: lineWidth, marginLeft: lineOffset }}
//         >
//           <div className="h-0.5 min-w-1 bg-blue-500 w-full"></div>
//         </div>
//       </div>
//       <div className="ml-auto text-gray-400 text-xs w-12 px-2">
//         {
//           // isMizuOrphanLog(spanOrLog)
//           // ? ""
//           // :
//           formatDuration(span.start_time, span.end_time)
//         }
//       </div>
//     </a>
//   );
// };

const useTimelineDimensions = (
  spanOrLog: NormalizedSpan | NormalizedOrphanLog,
) => {
  return useMemo(() => {
    const lineWidth = isMizuOrphanLog(spanOrLog)
      ? ""
      : `${spanOrLog.normalizedDuration * 100}%`;

    const lineOffset = isMizuOrphanLog(spanOrLog)
      ? `${spanOrLog.normalizedTimestamp * 100}%`
      : `${spanOrLog.normalizedStartTime * 100}%`;

    return { lineWidth, lineOffset };
  }, [spanOrLog]);
};

const useTimelineTitle = (spanOrLog: NormalizedSpan | NormalizedOrphanLog) => {
  return useMemo(() => {
    const isNeonCall = isNeonSpan(spanOrLog);
    if (isNeonCall) {
      return (
        <div
          className={cn(
            "uppercase",
            "font-normal",
            "font-mono",
            "text-xs",
            "truncate",
          )}
        >
          {spanOrLog.vendorInfo.sql?.query?.slice(0, 30)}
        </div>
      );
    }

    const isOpenAICall = isOpenAISpan(spanOrLog);
    if (isOpenAICall) {
      return (
        <div className={cn("font-normal", "font-mono", "text-xs", "truncate")}>
          OpenAI Call
        </div>
      );
    }

    const isAnthropicCall = isAnthropicSpan(spanOrLog);
    if (isAnthropicCall) {
      return (
        <div className={cn("font-normal", "font-mono", "text-xs", "truncate")}>
          Anthropic Call
        </div>
      );
    }

    const isRootRequest = isMizuRootRequestSpan(spanOrLog);
    if (isRootRequest) {
      return (
        <div className={cn("font-mono text-sm truncate", "text-gray-200")}>
          {spanOrLog.name}
        </div>
      );
    }

    const isFetch = !isMizuOrphanLog(spanOrLog) && spanOrLog.kind === "CLIENT";
    if (isFetch) {
      return (
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
      );
    }

    return (
      <div className="font-mono font-normal text-xs truncate text-gray-200">
        {/* TODO! */}
        log
        {/* {spanOrLog.name} */}
      </div>
    );
  }, [spanOrLog]);
};

const useTimelineIcon = (spanOrLog: NormalizedSpan | NormalizedOrphanLog) => {
  return useMemo(() => {
    let iconType = isMizuOrphanLog(spanOrLog) ? "log" : spanOrLog.kind;
    if (isMizuFetchSpan(spanOrLog) && canRenderVendorInfo(spanOrLog)) {
      iconType = spanOrLog.vendorInfo.vendor;
    }

    return getTypeIcon(iconType);
  }, [spanOrLog]);
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "request":
    case "SERVER":
      return <HonoLogo className="w-3.5 h-3.5" />;
    case "CLIENT":
    case "fetch":
      return <Diamond className="w-3.5 h-3.5 text-blue-600" />;
    case "log":
      return <Diamond className="w-3.5 h-3.5 text-orange-400" />;
    // NOT IN USE
    case "db":
      return <Database className="w-3.5 h-3.5 text-blue-600" />;
    case "neon":
      return <NeonLogo className="w-3.5 h-3.5 text-blue-600" />;
    case "openai":
      return <OpenAiLogo className="w-3.5 h-3.5 text-blue-600" />;
    case "anthropic":
      return <AnthropicLogo className="w-3.5 h-3.5 text-blue-600" />;
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


const WaterfallRowSpan: React.FC<{
  span: OtelSpan;
  duration: number;
  startTime: number;
}> = ({ span, duration, startTime }) => {
  const id = span.span_id;
  const spanDuration =
    new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
  const lineWidth = `${((spanDuration / duration) * 100).toPrecision(2)}%`;
  // console.log('spanDuration', spanDuration, lineWidth);
  const lineOffset = `${((new Date(span.start_time).getTime() - startTime) / duration) * 100}%`;
  const icon = getTypeIcon(span.kind);
  const isFetch = span.name === "fetch";
  const isRootRequest = span.parent_span_id === null;
  // span.kind === "SERVER";

  return (
    <a
      data-toc-id={id}
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent",
        "hover:bg-primary/10 hover:border-blue-500",
        // activeId === id && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${span.span_id}`}
    >
      <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
      <div className="flex flex-col w-20">
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
             {span.name}
           </Badge>
         </div>
       ) : isRootRequest ? (
         <div className="font-mono text-sm truncate">{span.name}</div>
       ) : (
         <div className="font-mono font-normal text-xs truncate text-gray-200">
           {/* TODO! */}
           {/* log */}
           {span.name}
           {/* {spanOrLog.name} */}
         </div>
       )}
     </div>
     <div className="text-gray-400 flex flex-grow items-center mx-4">
       <div
         className="h-2.5 border-l-2 border-r-2 border-blue-500 flex items-center min-w-1"
         style={{ width: lineWidth, marginLeft: lineOffset }}
       >
         <div className="h-0.5 min-w-1 bg-blue-500 w-full"></div>
       </div>
     </div>
     <div className="ml-auto text-gray-400 text-xs w-12 px-2">
       {
         // isMizuOrphanLog(spanOrLog)              
          // ? ""
          // :
          formatDuration(span.start_time, span.end_time)
        }
      </div>
    </a>
  );
};

const WaterfallRowLog: React.FC<{
  log: MizuOrphanLog;
  duration: number;
  startTime: number;
}> = ({ log, duration, startTime }) => {
  const id = log.id;
  // console.log('spanDuration', spanDuration, lineWidth);
  const lineOffset = `${((new Date(log.timestamp).getTime() - startTime) / duration) * 100}%`;
  const icon = "log";
  // const isFetch = span.name === "fetch";
  // const isRootRequest = span.parent_span_id === null;
  // span.kind === "SERVER";

  return (
    <a
      data-toc-id={id}
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent",
        "hover:bg-primary/10 hover:border-blue-500",
        // activeId === id && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${log.id}`}
    >
            <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
          <div className="flex flex-col w-20">
              <div className="font-mono font-normal text-xs truncate text-gray-200">
                log
            </div>
          </div>
          <div className="text-gray-400 flex flex-grow items-center mx-4">
              <div
              className="h-2.5 border-l-2flex items-center min-w-1"
              style={{ marginLeft: lineOffset }}
            >
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="ml-auto text-gray-400 text-xs w-12 px-2" />
        </a>
    );
  };
    