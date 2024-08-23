import { useOtelTraces } from "@/queries";
import { useOtelTrace } from "@/queries/traces-otel";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import { usePagination } from "../hooks";
import { RequestDetailsPageContentV2 } from "./RequestDetailsPageV2Content";
import { useOrphanLogs } from "./useOrphanLogs";

export function RequestDetailsPageV2({
  traceId,
}: {
  traceId: string;
}) {
  const { data: traces } = useOtelTraces();
  const { data: spans, isPending, error } = useOtelTrace(traceId);

  const pagination = usePagination({
    maxIndex: traces?.length ?? 0,
    traceId,
    findIndex: (traceId) => {
      if (!traces) {
        return undefined;
      }

      return traces.findIndex((trace) => trace.traceId === traceId);
    },
    getTraceRoute: (index: number) => {
      if (!traces) {
        return "";
      }

      return `/requests/otel/${traces[index].traceId}`;
    },
  });

  // NOTE - Flatten out events into orphan logs to allow the UI to render them
  const orphanLogs = useOrphanLogs(traceId, spans ?? []);

  if (error) {
    console.error("Error!", error);
  }

  if (isPending) {
    return <SkeletonLoader />;
  }

  if (!spans) {
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
