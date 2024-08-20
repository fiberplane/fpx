import AnthropicLogo from "@/assets/AnthropicLogo.svg";
import Database from "@/assets/Database.svg";
import Diamond from "@/assets/Diamond.svg";
import HonoLogo from "@/assets/HonoLogo.svg";
import NeonLogo from "@/assets/NeonLogo.svg";
import OpenAiLogo from "@/assets/OpenAILogo.svg";

import { Badge } from "@/components/ui/badge";
import { SpanKind } from "@/constants";
import { MizuOrphanLog, OtelSpan, isMizuOrphanLog } from "@/queries";
import { cn } from "@/utils";
import { formatDistanceStrict } from "date-fns";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Waterfall } from "../RequestDetailsPageV2/RequestDetailsPageV2Content";
import { isFetchSpan } from "./otel-helpers";
import {
  VendorInfo,
  isAnthropicVendorInfo,
  isNeonVendorInfo,
  isOpenAIVendorInfo,
} from "./vendorify-traces";

type TraceDetailsTimelineProps = {
  waterfall: Waterfall;
  className?: string;
};

const normalizeWaterfallTimestamps = (waterfall: Waterfall) => {
  const minStart = Math.min(
    ...waterfall.map((item) => {
      const time = "span" in item ? item.span.start_time : item.timestamp;
      return new Date(time).getTime();
    }),
  );
  const maxEnd = Math.max(
    ...waterfall.map((item) => {
      const time = "span" in item ? item.span.end_time : item.timestamp;
      return new Date(time).getTime();
    }),
  );

  return {
    minStart,
    // NOTE - `duration` could be 0
    duration: maxEnd - minStart,
  };
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
  const { minStart, duration } = normalizeWaterfallTimestamps(waterfall);

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
      className={cn(
        "text-white rounded-lg overflow-y-auto",
        "py-4",
        className,
        // NOTE - Likely need explicit height on this to allow for overflow to be scrollable :thinking_face:
        //        I ran into issues because of the stickiness + grid
        //        Problem now is that the portion above is now variable height.
        // "lg:h-[calc(100vh-80px)]"
      )}
    >
      <h3 className="text-muted-foreground text-sm uppercase mb-4">Timeline</h3>
      <div className="flex flex-col">
        {waterfall.map((spanOrLog) => {
          if (isMizuOrphanLog(spanOrLog)) {
            return (
              <WaterfallRowLog
                key={spanOrLog.id}
                log={spanOrLog}
                duration={duration}
                startTime={minStart}
                isActive={activeId === `${spanOrLog.id}`}
              />
            );
          }
          return (
            <WaterfallRowSpan
              key={spanOrLog.span.span_id}
              span={spanOrLog.span}
              vendorInfo={spanOrLog.vendorInfo}
              duration={duration}
              startTime={minStart}
              isActive={activeId === `${spanOrLog.span.span_id}`}
            />
          );
        })}
      </div>
    </div>
  );
};

const useTimelineTitle = (waterfallItem: Waterfall[0]) => {
  return useMemo(() => {
    if ("vendorInfo" in waterfallItem) {
      const { span, vendorInfo } = waterfallItem;
      const isNeonCall = isNeonVendorInfo(vendorInfo);
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
            DB Query
            {/* {vendorInfo.sql?.query?.slice(0, 30)} */}
          </div>
        );
      }

      const isOpenAICall = isOpenAIVendorInfo(vendorInfo);
      if (isOpenAICall) {
        return (
          <div
            className={cn("font-normal", "font-mono", "text-xs", "truncate")}
          >
            OpenAI Call
          </div>
        );
      }

      const isAnthropicCall = isAnthropicVendorInfo(vendorInfo);
      if (isAnthropicCall) {
        return (
          <div
            className={cn("font-normal", "font-mono", "text-xs", "truncate")}
          >
            Anthropic Call
          </div>
        );
      }

      const isRootRequest = span.kind === SpanKind.SERVER;
      if (isRootRequest) {
        return (
          <div
            className={cn(
              "font-mono text-sm truncate",
              "text-gray-200",
              "capitalize",
            )}
          >
            {span.name}
          </div>
        );
      }

      const isFetch = isFetchSpan(span);
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
              {span.name}
            </Badge>
          </div>
        );
      }

      return (
        <div className="font-mono font-normal text-xs truncate text-gray-200">
          {span.name}
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
  }, [waterfallItem]);
};

const useTimelineIcon = (
  spanOrLog: OtelSpan | MizuOrphanLog,
  vendorInfo?: VendorInfo,
) => {
  return useMemo(() => {
    let iconType = isMizuOrphanLog(spanOrLog) ? "log" : spanOrLog.kind;
    if (vendorInfo && vendorInfo.vendor !== "none") {
      iconType = vendorInfo.vendor;
    }

    return getTypeIcon(iconType);
  }, [spanOrLog, vendorInfo]);
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "request":
    case "SERVER":
    case SpanKind.SERVER:
      return <HonoLogo className="w-3.5 h-3.5" />;
    case "CLIENT":
    case SpanKind.CLIENT:
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
  vendorInfo: VendorInfo;
  duration: number;
  startTime: number;
  isActive: boolean;
}> = ({ span, duration, vendorInfo, startTime, isActive }) => {
  const id = span.span_id;
  const spanDuration =
    new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
  const normalizedDuration = spanDuration / duration;
  // NOTE - We want to render a single line, instead of a tai-fighter shape, if the span is less than 1% of the total duration
  const shouldRenderSingleLine = normalizedDuration < 0.01;
  const percentageWidth =
    duration === 0 ? 100 : (normalizedDuration * 100).toPrecision(2);
  const lineWidth = `${percentageWidth}%`;
  const lineOffsetNumeric =
    duration === 0
      ? 0
      : ((new Date(span.start_time).getTime() - startTime) / duration) * 100;
  const lineOffset = `${lineOffsetNumeric}%`;
  const icon = useTimelineIcon(span, vendorInfo);
  const title = useTimelineTitle({ span, vendorInfo });

  return (
    <a
      data-toc-id={id}
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent",
        "hover:bg-primary/10 hover:border-blue-500",
        isActive && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${span.span_id}`}
    >
      <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
      <div className="flex flex-col w-20 overflow-hidden">{title}</div>
      <div className="text-gray-400 flex flex-grow items-center mx-4">
        <div
          className={cn(
            "h-2.5 border-l-2 border-r-2 border-blue-500 flex items-center min-w-1",
            shouldRenderSingleLine && "border-r-0",
          )}
          style={{ width: lineWidth, marginLeft: lineOffset }}
        >
          <div
            className={cn(
              "h-0.5 min-w-0.5 bg-blue-500 w-full",
              shouldRenderSingleLine && "bg-transparent",
            )}
          ></div>
        </div>
      </div>
      <div className="ml-auto text-gray-400 text-xs w-12 px-2">
        {formatDuration(span.start_time, span.end_time)}
      </div>
    </a>
  );
};

const WaterfallRowLog: React.FC<{
  log: MizuOrphanLog;
  duration: number;
  startTime: number;
  isActive: boolean;
}> = ({ log, duration, startTime, isActive }) => {
  const id = log.id;
  const lineOffset = `${((new Date(log.timestamp).getTime() - startTime) / duration) * 100}%`;
  const icon = useTimelineIcon(log);
  const title = useTimelineTitle(log);

  return (
    <a
      data-toc-id={id}
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent",
        "hover:bg-primary/10 hover:border-blue-500",
        isActive && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${log.id}`}
    >
      <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
      <div className="flex flex-col w-20 overflow-hidden">
        <div className="font-mono font-normal text-xs truncate text-gray-200">
          {title}
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
