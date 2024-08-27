import { isMizuOrphanLog } from "@/queries";
import { isFetchSpan, isIncomingRequestSpan, type Waterfall } from "@/utils";
import { OrphanLog } from "./OrphanLog";
import { FetchSpan, GenericSpan, IncomingRequest } from "./spans";

export function TimelineListDetails({
  waterfall,
}: {
  waterfall: Waterfall;
}) {
  // TODO: merge spans and orphanLogs
  return (
    <div className="grid gap-4" id="trace-details-v2">
      {waterfall.map((item) => {
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
      })}
    </div>
  );
}
