import { LogHeader } from "@/components/Log";
import { isMizuOrphanLog } from "@/types";
import { type Waterfall, isFetchSpan, isIncomingRequestSpan } from "@/utils";
import { FetchSpanHeader } from "../spans/FetchSpan/FetchSpanHeader";
import { GenericSpanHeader } from "../spans/GenericSpan/GenericSpanHeader";
import { IncomingRequestHeader } from "../spans/IncomingRequest/IncomingRequestHeader";

export function TimelineDetailItemHeader({
  item,
}: {
  item: Waterfall[0];
}) {
  if (isMizuOrphanLog(item)) {
    return <LogHeader message={item.message} />;
  }

  if (isIncomingRequestSpan(item.span)) {
    return <IncomingRequestHeader attributes={item.span.attributes} />;
  }

  if (isFetchSpan(item.span)) {
    return <FetchSpanHeader attributes={item.span.attributes} />;
  }

  return (
    <GenericSpanHeader
      attributes={item.span.attributes}
      name={item.span.name}
      vendorInfo={item.vendorInfo}
    />
  );
}
