import { SpanStatus } from "@/constants";
import { type MizuOrphanLog, isMizuOrphanLog } from "@/types";
import type { SpanWithVendorInfo, Waterfall } from "@/utils";
import {
  getStatusCode,
  isFetchSpan,
  isIncomingRequestSpan,
} from "../../../../utils/otel-helpers";

export function getId(element: SpanNode | MizuOrphanLog | SpanWithVendorInfo) {
  if (isMizuOrphanLog(element)) {
    return `${element.id}`;
  }
  if ("item" in element) {
    return element.item.span.span_id;
  }

  return element.span.span_id;
}

export type SpanNode = {
  item: SpanWithVendorInfo;
  children: Array<SpanNode>;
};

/**
 * Filters out the orphan logs from the waterfall and returns the spans
 * in a tree structure, where each leave contains a link to the span and a list of child spans.
 * @param waterfall
 */
export function convertToTree(waterfall: Waterfall): SpanNode | null {
  const spans = [...waterfall].filter(
    (item: SpanWithVendorInfo | MizuOrphanLog) => !isMizuOrphanLog(item),
  ) as Array<SpanWithVendorInfo>;

  // HACK - normally we'd look for the root span by trying to find the span with the parent_span_id === null
  //        but we set a fake parent_span_id for the root span in the middleware for now
  const rootSpans = spans.filter((item) => item.span.name === "request");

  const buildTree = (
    span: SpanWithVendorInfo,
    collection: Array<SpanWithVendorInfo>,
  ): SpanNode => {
    const children = collection.filter(
      (s) => s.span.parent_span_id === span.span.span_id,
    );
    return {
      item: span,
      children: children.map((child) => buildTree(child, collection)),
    };
  };

  const tree = rootSpans.map((span) => buildTree(span, spans));
  if (tree.length > 0) {
    return tree[0];
  }

  return null;
}

export function getLevelForSpan(item: SpanWithVendorInfo) {
  if (isFetchSpan(item.span) || isIncomingRequestSpan(item.span)) {
    const statusCode = getStatusCode(item.span);

    if (statusCode >= 500) {
      return "error";
    }
    if (statusCode >= 400) {
      return "warn";
    }
    return "info";
  }
  if (item.span.status?.code === SpanStatus.ERROR) {
    return "error";
  }
  return "info";
}
