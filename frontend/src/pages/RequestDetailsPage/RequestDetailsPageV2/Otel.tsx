import { MizuOrphanLog, isMizuOrphanLog } from "@/queries";
import { useOtelTraces } from "@/queries/hotel";
import { OtelEvent, useOtelTrace } from "@/queries/traces-otel";
import { useMemo } from "react";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import { usePagination } from "../hooks";
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
  const { data: traces } = useOtelTraces();
  const { data: spans, isPending, error } = useOtelTrace(traceId);

  const pagination = usePagination({
    maxIndex: traces?.length ?? 0,
    traceId,
    findIndex: (traceId) => {
      if (!traces) {
        return undefined;
      }

      return traces.findIndex((trace) => trace.trace_id === traceId);
    },
    getTraceRoute: (index: number) => {
      if (!traces) {
        return "";
      }

      return `/requests/otel/${traces[index].trace_id}`;
    },
  });

  // NOTE - Flatten out events into orphan logs to allow the UI to render them
  const orphanLogs = useMemo(() => {
    const orphans: MizuOrphanLog[] = [];
    for (const span of spans ?? []) {
      if (span.events) {
        for (const event of span.events) {
          // TODO - Visualize other types of events on the timeline?
          if (event.name === "log") {
            let args =
              safeParseJson(getString(event.attributes.arguments)) || [];
            if (!Array.isArray(args)) {
              args = [args];
            }
            // TODO - Use a more deterministic ID - preferably string that includes the trace+span+event_index
            const logId = Math.floor(Math.random() * 1000000);
            const orphanLog = convertEventToOrphanLoc(traceId, logId, event);
            // HACK - We want to be sure that we construct a valid orphan log, otherwise the UI will break
            if (isMizuOrphanLog(orphanLog)) {
              orphans.push(orphanLog);
            } else {
              console.error("Constructed invalid orphan log", orphanLog);
            }
          }
        }
      }
    }
    return orphans;
  }, [spans, traceId]);

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

/**
 * Converts an Otel event to a so-called Orphan Log to maintain backwards compatibility with the old Mizu data format
 */
function convertEventToOrphanLoc(
  traceId: string,
  logId: number,
  event: OtelEvent,
) {
  return {
    id: logId,
    traceId,
    level: getString(event.attributes.level),
    args: safeParseJson(getString(event.attributes.args)) || [],
    timestamp: event.timestamp,
    message: getString(event.attributes.message),
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  };
}
