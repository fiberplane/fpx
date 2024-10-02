import { LogContent } from "@/components/Log";
import { isMizuOrphanLog } from "@/queries";
import { type Waterfall, isFetchSpan, isIncomingRequestSpan } from "@/utils";
import { FetchSpanContent } from "../spans/FetchSpan/FetchSpanContent";
import { GenericSpanContent } from "../spans/GenericSpan/GenericSpanContent";
import { IncomingRequestContent } from "../spans/IncomingRequest/IncomingRequestContent";

export function Content({
  item,
  // traceDuration,
  // traceStartTime,
  // isExpanded,
  // toggleExpand,
}: {
  item: Waterfall[0];
  // traceDuration: number;
  // traceStartTime: number;
  // isExpanded: boolean;
  // toggleExpand: () => void;
}) {
  if (isMizuOrphanLog(item)) {
    // const marginLeft = `${(((item.timestamp.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
    return (
      // <div style={{ marginLeft }} className="overflow-hidden">
      <LogContent args={item.args} level={item.level} message={item.message} />
      // </div>
    );
  }

  if (isIncomingRequestSpan(item.span)) {
    return <IncomingRequestContent attributes={item.span.attributes} />;
  }

  if (isFetchSpan(item.span)) {
    return (
      <FetchSpanContent
        attributes={item.span.attributes}
        vendorInfo={item.vendorInfo}
      />
    );
  }

  // const marginLeft = `${(((item.span.start_time.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
  return (
    // <div style={{ marginLeft }} className="min-h-[24px] flex items-center">
    <GenericSpanContent
      attributes={item.span.attributes}
      kind={item.span.kind}
      parent_span_id={item.span.parent_span_id}
      span_id={item.span.span_id}
      trace_id={item.span.trace_id}
      events={item.span.events}
      status={item.span.status}
      end_time={item.span.end_time}
      start_time={item.span.start_time}
      vendorInfo={item.vendorInfo}
      // isExpanded={isExpanded}
    />
    // </div>
  );
}
