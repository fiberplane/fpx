import type { MizuOrphanLog } from "@/queries";
import {
  type SpanWithVendorInfo,
  type Waterfall,
  getVendorInfo,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";

export function useAsWaterfall(
  spans: Array<OtelSpan>,
  orphanLogs: Array<MizuOrphanLog>,
) {
  const spansWithVendorInfo: Array<SpanWithVendorInfo> = useMemo(
    () =>
      spans.map((span) => ({
        span,
        vendorInfo: getVendorInfo(span),
      })),
    [spans],
  );

  // HACK - normally we'd look for the root span by trying to find the span with the parent_span_id === null
  //        but we set a fake parent_span_id for the root span in the middleware for now
  const rootSpan = spansWithVendorInfo.find(
    // (item) => item.span.parent_span_id === null,
    (item) => item.span.name === "request",
  );

  const waterfall = useMemo(
    (): Waterfall => sortWaterfall([...spansWithVendorInfo, ...orphanLogs]),
    [spansWithVendorInfo, orphanLogs],
  );

  return {
    rootSpan,
    waterfall,
  };
}

export function sortWaterfall(items: Waterfall): Waterfall {
  return items.sort((a, b) => {
    const timeA = "span" in a ? a.span.start_time : a.timestamp;
    const timeB = "span" in b ? b.span.start_time : b.timestamp;
    if (timeA.getTime() === timeB.getTime()) {
      // If the times are the same, we need to sort giving the priority to the root span
      if ("span" in a && a?.span?.name === "request") {
        return -1;
      }
      if ("span" in b && b?.span?.name === "request") {
        return 1;
      }

      // If the time stamp is the same, sort on span_id/parent_span_id
      // TODO: improve further sorting.
      if ("span" in a && "span" in b) {
        if (a.span.span_id === b.span.parent_span_id) {
          return -1;
        }
        if (b.span.span_id === a.span.parent_span_id) {
          return 1;
        }
      }
    }
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });
}
