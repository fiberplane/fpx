import { LogContent } from "@/components/Log";
import { isMizuOrphanLog } from "@/types";
import { type Waterfall, isFetchSpan, isIncomingRequestSpan } from "@/utils";
import { FetchSpanContent } from "../spans/FetchSpan/FetchSpanContent";
import { GenericSpanContent } from "../spans/GenericSpan/GenericSpanContent";
import { IncomingRequestContent } from "../spans/IncomingRequest/IncomingRequestContent";

export function Content({
  item,
}: {
  item: Waterfall[0];
}) {
  if (isMizuOrphanLog(item)) {
    return (
      <LogContent args={item.args} level={item.level} message={item.message} />
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

  return (
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
    />
  );
}
