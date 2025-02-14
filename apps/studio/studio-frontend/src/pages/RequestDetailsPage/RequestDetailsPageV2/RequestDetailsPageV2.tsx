import { useOrphanLogs } from "@/hooks";
import { useOtelTraces } from "@/queries";
import { useOtelTrace } from "@/queries/traces-otel";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import { usePagination } from "../hooks";
import { RequestDetailsPageContentV2 } from "./RequestDetailsPageV2Content";

export function RequestDetailsPageV2({
  traceId,
  paginationHidden = false,
  generateLinkToTrace,
}: {
  traceId: string;
  paginationHidden?: boolean;
  generateLinkToTrace: (traceId: string) => string;
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

      return generateLinkToTrace(traces[index].traceId);
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
      traceId={traceId}
      spans={spans}
      orphanLogs={orphanLogs}
      pagination={paginationHidden ? undefined : pagination}
      generateLinkToTrace={generateLinkToTrace}
    />
  );
}
