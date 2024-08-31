import { isMizuOrphanLog } from "@/queries";
import {
  type Waterfall,
  cn,
  isFetchSpan,
  isIncomingRequestSpan,
} from "@/utils";
import { memo } from "react";
import { useTimelineContext } from "../context";
import { OrphanLog } from "./OrphanLog";
import { FetchSpan, GenericSpan, IncomingRequest } from "./spans";

function TimelineListDetailsComponent({
  waterfall,
}: {
  waterfall: Waterfall;
}) {
  const { highlightedSpanId, setHighlightedSpanId } = useTimelineContext();
  // TODO: merge spans and orphanLogs
  return (
    <div className="grid gap-2" id="trace-details-v2">
      {waterfall.map((item) => (
        <div
          key={getId(item)}
          onMouseEnter={() => setHighlightedSpanId(getId(item))}
          onMouseLeave={() => setHighlightedSpanId(null)}
          className={cn(
            "p-2 max-w-full overflow-hidden",
            "border-l-2 border-transparent rounded-sm transition-all bg-transparent",
            "hover:bg-primary/10 hover:border-blue-500 hover:rounded-l-none",
            "data-[highlighted=true]:bg-primary/10",
            "relative after:absolute after:bottom-[-4px] after:bg-muted-foreground/30 after:w-full after:h-px last:after:h-0",
          )}
          data-highlighted={highlightedSpanId === getId(item)}
        >
          <Content item={item} />
        </div>
      ))}
    </div>
  );
}
export const TimelineListDetails = memo(TimelineListDetailsComponent);

const Content = ({ item }: { item: Waterfall[0] }) => {
  if (isMizuOrphanLog(item)) {
    return <OrphanLog log={item} key={item.id} />;
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

  return <GenericSpan span={item.span} key={item.span.span_id} />;
};

function getId(item: Waterfall[0]) {
  if (isMizuOrphanLog(item)) {
    return `${item.id}`;
  }
  return item.span.span_id;
}
