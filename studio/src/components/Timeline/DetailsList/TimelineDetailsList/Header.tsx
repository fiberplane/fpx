import { LogHeader } from "@/components/Log";
import { isMizuOrphanLog } from "@/queries";
import { type Waterfall, isFetchSpan, isIncomingRequestSpan } from "@/utils";
import { FetchSpanHeader } from "../spans/FetchSpan/FetchSpanHeader";
import { GenericSpanHeader } from "../spans/GenericSpan/GenericSpanHeader";
import { IncomingRequestHeader } from "../spans/IncomingRequest/IncomingRequestHeader";

export function TimelineDetailItemHeader({
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
      <LogHeader
        // logLevel={item.level}
        message={item.message}
      />
      // </div>
    );
  }

  if (isIncomingRequestSpan(item.span)) {
    return <IncomingRequestHeader attributes={item.span.attributes} />;
  }

  if (isFetchSpan(item.span)) {
    return (
      <FetchSpanHeader
        attributes={item.span.attributes}
        // vendorInfo={item.vendorInfo}
        // attributes={item.span.attributes}
        // vendorInfo={item.vendorInfo}
        // key={item.span.span_id}
        // isExpanded={isExpanded}
      />
    );
  }

  // const marginLeft = `${(((item.span.start_time.getTime() - traceStartTime) / traceDuration) * 100).toPrecision(4)}%`;
  return (
    // <div style={{ marginLeft }} className="min-h-[24px] flex items-center">
    <GenericSpanHeader
      attributes={item.span.attributes}
      name={item.span.name}
      vendorInfo={item.vendorInfo}
      // span={item.span}
      // key={item.span.span_id}
      // vendorInfo={item.vendorInfo}
      // isExpanded={isExpanded}
    />
    // </div>
  );
}
