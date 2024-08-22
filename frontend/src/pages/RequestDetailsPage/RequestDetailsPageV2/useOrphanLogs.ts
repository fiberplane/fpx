import { MizuOrphanLog, isMizuOrphanLog } from "@/queries";
import { safeParseJson } from "@/utils";
import { OtelEvent, OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { getString } from "../v2/otel-helpers";

export function useOrphanLogs(traceId: string, spans: Array<OtelSpan>) {
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
            const orphanLog = convertEventToOrphanLog(traceId, logId, event);
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

  return orphanLogs;
}

/**
 * Converts an Otel event to a so-called Orphan Log to maintain backwards compatibility with the old Mizu data format
 */
function convertEventToOrphanLog(
  traceId: string,
  logId: number,
  event: OtelEvent,
) {
  const argsAsString = getString(event.attributes.arguments);
  const parsedArgs = argsAsString ? safeParseJson(argsAsString) : [];

  return {
    id: logId,
    traceId,
    level: getString(event.attributes.level),
    args: parsedArgs || [],
    timestamp: event.timestamp,
    message: getString(event.attributes.message),
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
  };
}
