import type { VendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { GenericSpanContent } from "./GenericSpanContent";
import { GenericSpanHeader } from "./GenericSpanHeader";

type Props = {
  span: OtelSpan;
  vendorInfo: VendorInfo;
  isExpanded?: boolean;
};
export function GenericSpan({ span, vendorInfo, isExpanded }: Props) {
  // const isCfSpan = isCloudflareVendorInfo(vendorInfo);
  // const name = isCfSpan ? getCloudflareSpanName(span, vendorInfo) : span.name;
  // const exception = span.events?.find((event) => event.name === "exception");
  return (
    <div id={span.span_id}>
      <GenericSpanHeader
        vendorInfo={vendorInfo}
        name={span.name}
        attributes={span.attributes}
      />
      {isExpanded && (
        <GenericSpanContent
          attributes={span.attributes}
          end_time={span.end_time}
          start_time={span.start_time}
          kind={span.kind}
          parent_span_id={span.parent_span_id}
          span_id={span.span_id}
          status={span.status}
          trace_id={span.trace_id}
          vendorInfo={vendorInfo}
        />
      )}
    </div>
  );
}
