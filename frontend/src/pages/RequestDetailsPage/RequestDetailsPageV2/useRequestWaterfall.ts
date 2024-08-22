import { MizuOrphanLog } from "@/queries";
import { useMemo } from "react";
import { getVendorInfo } from "../v2/vendorify-traces";
import { SpanWithVendorInfo, Waterfall } from "./RequestDetailsPageV2Content";
import { OtelSpan } from "@fiberplane/fpx-types";

export function useRequestWaterfall(
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

  const waterfall = useMemo((): Waterfall => {
    return [...spansWithVendorInfo, ...orphanLogs].sort((a, b) => {
      const timeA = "span" in a ? a.span.start_time : a.timestamp;
      const timeB = "span" in b ? b.span.start_time : b.timestamp;
      if (timeA === timeB) {
        // If the times are the same, we need to sort giving the priority to the root span
        if ("span" in a && a?.span?.name === "request") {
          return -1;
        }
        if ("span" in b && b?.span?.name === "request") {
          return 1;
        }
      }
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  }, [spansWithVendorInfo, orphanLogs]);

  return {
    rootSpan,
    waterfall,
  };
}
