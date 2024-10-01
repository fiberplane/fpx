import { LogContent } from "@/components/LogContent";
import { isMizuOrphanLog } from "@/queries";
import { type Waterfall, isFetchSpan, isIncomingRequestSpan } from "@/utils";
import { FetchSpan, GenericSpan, IncomingRequest } from "../spans";

export function Content({
  item,
  traceDuration,
  traceStartTime,
  isExpanded,
  toggleExpand,
}: {
  item: Waterfall[0];
  traceDuration: number;
  traceStartTime: number;
  isExpanded: boolean;
  toggleExpand: () => void;
}) {
  if (isMizuOrphanLog(item)) {
    const marginLeft = `${(((item.timestamp.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
    return (
      <div style={{ marginLeft }} className="overflow-hidden">
        {/* <OrphanLog log={item} key={item.id} /> */}
        <LogContent
          log={item}
          key={item.id}
          showTimestamp={false}
          showIcon={false}
          toggleExpand={toggleExpand}
          isExpanded={isExpanded}
        />
      </div>
    );
  }

  if (isIncomingRequestSpan(item.span)) {
    return (
      <IncomingRequest
        span={item.span}
        key={item.span.span_id}
        isExpanded={isExpanded}
      />
    );
  }

  if (isFetchSpan(item.span)) {
    return (
      <FetchSpan
        span={item.span}
        vendorInfo={item.vendorInfo}
        key={item.span.span_id}
        isExpanded={isExpanded}
      />
    );
  }

  const marginLeft = `${(((item.span.start_time.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
  return (
    <div style={{ marginLeft }} className="min-h-[24px] flex items-center">
      <GenericSpan
        span={item.span}
        key={item.span.span_id}
        vendorInfo={item.vendorInfo}
        isExpanded={isExpanded}
      />
    </div>
  );
}
