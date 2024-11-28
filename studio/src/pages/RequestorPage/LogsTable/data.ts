import type { MizuOrphanLog } from "@/queries";
import {
  getErrorEvents,
  getNeonSqlQuery,
  getResponseBody,
  isJson,
  isNeonFetch,
  safeParseJson,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import type { LogEntry, NeonEvent } from "./types";

export function useLogsWithEvents(spans: OtelSpan[], logs: MizuOrphanLog[]) {
  // Here we can insert relevant events that happend, in order to link back to the timeline.
  // For now, we're just looking for Neon database queries
  return useMemo<LogEntry[]>(() => {
    const neonSpans = spans?.filter((span) => isNeonFetch(span));
    const neonEvents: NeonEvent[] = neonSpans?.map(neonSpanToEvent) ?? [];
    if (neonEvents?.length) {
      const result = [...logs, ...neonEvents];
      return result.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
    }

    return logs;
  }, [logs, spans]);
}

function neonSpanToEvent(span: OtelSpan): NeonEvent {
  const responseBody = getResponseBody(span);
  const parsedResponseBody =
    responseBody && isJson(responseBody) ? safeParseJson(responseBody) : null;
  const rowCount =
    parsedResponseBody && "rowCount" in parsedResponseBody
      ? (Number.parseInt(parsedResponseBody.rowCount ?? "") ?? null)
      : null;

  // E.g., "SELECT"
  const command =
    parsedResponseBody && "command" in parsedResponseBody
      ? parsedResponseBody.command
      : null;
  const errorEvents = getErrorEvents(span);

  return {
    id: span.span_id,
    type: "neon-event",
    errors: errorEvents,
    timestamp: span.end_time,
    sql: getNeonSqlQuery(span),
    command,
    rowCount,
    duration: span.end_time.getTime() - span.start_time.getTime(),
  };
}
