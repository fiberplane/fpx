import { MizuOrphanLog } from "@/queries";
import { OtelEvent, useOtelTrace } from "@/queries/traces-otel";
import { useMemo } from "react";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import { getString } from "../v2/otel-helpers";
import { RequestDetailsPageContentV2 } from "./RequestDetailsPageV2Content";

const safeParseJson = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return jsonString;
  }
};

export function Otel({
  traceId,
}: {
  traceId: string;
}) {
  const { data: spans, isPending, error } = useOtelTrace(traceId);

  const orphanLogs = useMemo(() => {
    const orphans: MizuOrphanLog[] = [];
    // TODO - Flatten out events
    for (const span of spans ?? []) {
      if (span.events) {
        for (const event of span.events) {
          if (event.name === "log") {
            let args =
              safeParseJson(getString(event.attributes.arguments)) || [];
            if (!Array.isArray(args)) {
              args = [args];
            }
            orphans.push(convertEventsToOrphanLog(traceId, event));
          }
        }
      }
    }
    return orphans;
  }, [spans, traceId]);

  console.log("spans", spans);
  console.log("orphanLogs", orphanLogs);
  if (error) {
    console.error("Error!", error);
  }

  if (isPending) {
    return <SkeletonLoader />;
  }

  if (!spans) {
    return <EmptyState />;
  }

  return <RequestDetailsPageContentV2 spans={spans} orphanLogs={orphanLogs} />;
}

function convertEventsToOrphanLog(traceId: string, event: OtelEvent) {
  return {
    id: Math.floor(Math.random() * 1000000),
    traceId,
    level: getString(event.attributes.level),
    args: safeParseJson(getString(event.attributes.args)) || [],
    timestamp: event.timestamp,
    message: getString(event.attributes.message),
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  };
}
