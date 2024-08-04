import { useOtelTrace } from "@/queries/traces-otel";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import { RequestDetailsPageContentV2 } from "./RequestDetailsPageV2Content";

export function Otel({
  traceId,
}: {
  traceId: string;
}) {
  const { data: spans, isPending, error } = useOtelTrace(traceId);
  console.log("spans", spans);
  if (error) {
    console.error("Error!", error);
  }

  if (isPending) {
    return <SkeletonLoader />;
  }

  if (!spans) {
    return <EmptyState />;
  }

  return <RequestDetailsPageContentV2 spans={spans} />;
}
