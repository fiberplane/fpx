import { isMizuOrphanLog } from "@/queries";
import {
  type Waterfall,
  cn,
  isFetchSpan,
  isIncomingRequestSpan,
} from "@/utils";
import { memo } from "react";
import { useTimelineContext } from "../context";
import { DurationIndicator } from "../graph/DurationIndicator";
import { OrphanLog } from "./OrphanLog";
import { FetchSpan, GenericSpan, IncomingRequest } from "./spans";

function TimelineListDetailsComponent({
  waterfall,
  minStart,
  duration,
}: {
  waterfall: Waterfall;
  minStart: number;
  duration: number;
}) {
  const { highlightedSpanId, setHighlightedSpanId } = useTimelineContext();
  // TODO: merge spans and orphanLogs
  return (
    <div className="grid gap-2">
      {waterfall.map((item) => (
        <div
          key={getId(item)}
          onMouseEnter={() => setHighlightedSpanId(getId(item))}
          onMouseLeave={() => setHighlightedSpanId(null)}
          className={cn(
            "max-w-full overflow-hidden",
            "border-l-2 border-transparent rounded-sm transition-all bg-transparent",
            "data-[highlighted=true]:bg-primary/10",
            "relative after:absolute after:bottom-[-4px] after:bg-muted-foreground/30 after:w-full after:h-px last:after:h-0",
            "grid gap-2 bg-muted/50",
          )}
          data-highlighted={highlightedSpanId === getId(item)}
        >
          {!isMizuOrphanLog(item) && (
            <DurationIndicator
              itemStartTime={item.span.start_time.getTime()}
              itemDuration={
                item.span.end_time.getTime() - item.span.start_time.getTime()
              }
              traceDuration={duration}
              traceStartTime={minStart}
            />
          )}
          <div>
            <Content
              item={item}
              traceDuration={duration}
              traceStartTime={minStart}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
export const TimelineListDetails = memo(TimelineListDetailsComponent);

const Content = ({
  item,
  traceDuration,
  traceStartTime,
}: { item: Waterfall[0]; traceDuration: number; traceStartTime: number }) => {
  if (isMizuOrphanLog(item)) {
    const marginLeft = `${(((item.timestamp.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
    return (
      <div style={{ marginLeft }}>
        <OrphanLog log={item} key={item.id} />
      </div>
    );
  }

  if (isIncomingRequestSpan(item.span)) {
    return <IncomingRequest span={item.span} key={item.span.span_id} />;
  }

  if (isFetchSpan(item.span)) {
    return (
      <FetchSpan
        span={item.span}
        vendorInfo={item.vendorInfo}
        key={item.span.span_id}
      />
    );
  }

  const marginLeft = `${(((item.span.start_time.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
  return (
    <div style={{ marginLeft }}>
      <GenericSpan
        span={item.span}
        key={item.span.span_id}
        vendorInfo={item.vendorInfo}
      />
    </div>
  );
};

function getId(item: Waterfall[0]) {
  if (isMizuOrphanLog(item)) {
    return `${item.id}`;
  }
  return item.span.span_id;
}
