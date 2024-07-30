import { useRequestDetails } from "@/hooks";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import { usePagination } from "../hooks";
import { RequestDetailsPageContentV2 } from "./RequestDetailsPageV2Content";

export function Hackadoodle({
  traceId,
}: {
  traceId: string;
}) {
  const {
    traces,
    traceV2,
    isPending,
  } = useRequestDetails(traceId);

  const { spans, orphanLogs = [] } = traceV2 || {};
  const rootSpan = spans?.find((span) => span.parent_span_id === null);

  const pagination = usePagination({
    maxIndex: spans?.length ?? 0,
    traceId,
    findIndex: (traceId) => {
      if (!traces) {
        return undefined;
      }

      return traces.findIndex((trace) => trace.id === traceId);
    },
    getTraceRoute: (index: number) => {
      if (!traces) {
        return "";
      }

      return `/requests/${traces[index].id}`;
    },
  });

  if (isPending) {
    return <SkeletonLoader />;
  }

  if (!spans || !rootSpan) {
    return <EmptyState />;
  }

  return (
    <RequestDetailsPageContentV2
      spans={spans}
      orphanLogs={orphanLogs}
      pagination={pagination}
    />
  );
}
