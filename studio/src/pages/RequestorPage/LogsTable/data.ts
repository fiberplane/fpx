import type { MizuOrphanLog } from "@/queries";
import {
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
  const rowCount =
    responseBody && isJson(responseBody)
      ? Number.parseInt(safeParseJson(responseBody)?.rowCount ?? "") ?? null
      : null;
  return {
    id: span.span_id,
    type: "neon-event",
    timestamp: span.end_time,
    sql: getNeonSqlQuery(span),
    rowCount,
    duration: span.end_time.getTime() - span.start_time.getTime(),
  };
}
