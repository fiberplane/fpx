import { type MizuOrphanLog, isMizuOrphanLog } from "@/queries";
import type { CallerLocation } from "@/queries/traces-interop";
import { safeParseJson } from "@/utils";
import { getString } from "@/utils";
import type { OtelEvent, OtelSpan } from "@fiberplane/fpx-types";
import {
  SEMATTRS_EXCEPTION_MESSAGE,
  SEMATTRS_EXCEPTION_STACKTRACE,
} from "@opentelemetry/semantic-conventions";
import { useMemo } from "react";
import { parse } from "stacktrace-parser";

export function useOrphanLogs(traceId: string, spans: Array<OtelSpan>) {
  // NOTE - Flatten out events into orphan logs to allow the UI to render them
  const orphanLogs = useMemo(() => {
    const orphans: MizuOrphanLog[] = [];
    for (const span of spans ?? []) {
      if (span.events) {
        const logs = convertEventsToOrphanLogs(
          span.events,
          traceId,
          span.span_id,
        );
        orphans.push(...logs);
      }
    }
    return orphans;
  }, [spans, traceId]);

  return orphanLogs;
}

export function convertEventsToOrphanLogs(
  events: OtelEvent[],
  traceId: string,
  spanId: string,
) {
  const orphans: MizuOrphanLog[] = [];
  // if (span.events) {
  for (const event of events) {
    switch (event.name) {
      case "log": {
        let args = safeParseJson(getString(event.attributes.arguments)) || [];
        if (!Array.isArray(args)) {
          args = [args];
        }
        // TODO - Use a more deterministic ID - preferably string that includes the trace+span+event_index
        const logId = Math.floor(Math.random() * 1000000);
        const orphanLog = convertLogEventToOrphanLog(
          traceId,
          logId,
          event,
          spanId,
        );
        // HACK - We want to be sure that we construct a valid orphan log, otherwise the UI will break
        if (isMizuOrphanLog(orphanLog)) {
          orphans.push(orphanLog);
        } else {
          console.error("Constructed invalid orphan log", orphanLog);
        }
        break;
      }
      case "exception": {
        // Convert the exception event to a log event
        const logId = Math.floor(Math.random() * 1000000);
        const orphanLog = convertExceptionEventToOrphanLog(
          traceId,
          logId,
          event,
          spanId,
        );
        // console.log("event", event, orphanLog);

        // HACK - We want to be sure that we construct a valid orphan log, otherwise the UI will break
        if (isMizuOrphanLog(orphanLog)) {
          orphans.push(orphanLog);
        } else {
          console.error("Constructed invalid orphan log", orphanLog);
        }
        break;
      }
      default: {
        // TODO - Visualize other types of events on the timeline?
      }
    }
  }
  // }
  return orphans;
}

/**
 * Converts an Otel event to a so-called Orphan Log to maintain backwards compatibility with the old Mizu data format
 */
export function convertLogEventToOrphanLog(
  traceId: string,
  logId: number,
  event: OtelEvent,
  spanId: string,
): MizuOrphanLog {
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
    relatedSpanId: spanId,
  };
}

export function convertExceptionEventToOrphanLog(
  traceId: string,
  logId: number,
  event: OtelEvent,
  spanId: string,
): MizuOrphanLog {
  const stackTrace = getString(event.attributes[SEMATTRS_EXCEPTION_STACKTRACE]);
  const callerLocation = stackTrace
    ? parse(stackTrace).map(
        (item): CallerLocation => ({
          column: item.column,
          file: item.file,
          arguments: item.arguments,
          methodName: item.methodName,
          line: item.lineNumber,
        }),
      )
    : null;

  const message = JSON.stringify(
    getString(event.attributes[SEMATTRS_EXCEPTION_MESSAGE]),
  );

  return {
    id: logId,
    traceId,
    args: [],
    message,
    level: "error",
    callerLocations: callerLocation,
    timestamp: event.timestamp,
    createdAt: event.timestamp,
    updatedAt: event.timestamp,
    relatedSpanId: spanId,
    isException: true,
  };
}
