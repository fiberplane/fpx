import { useOrphanLogs } from "@/hooks";
import { useOtelTrace } from "@/queries";
import {
  getNeonSqlQuery,
  getResponseBody,
  isJson,
  isNeonFetch,
  safeParseJson,
} from "@/utils";
import { useMemo } from "react";
import { LogsEmptyState } from "./Empty";
import { LogsTableRow } from "./LogsTableRow";
import type { LogEntry, NeonEvent } from "./types";

type Props = {
  traceId?: string;
};

const EMPTY_LIST: LogEntry[] = [];

export function LogsTable({ traceId }: Props) {
  if (!traceId) {
    return <LogsTableContent logs={EMPTY_LIST} />;
  }

  return <LogsTableWithTraceId traceId={traceId} />;
}

const LogsTableWithTraceId = ({ traceId }: { traceId: string }) => {
  const { data: spans } = useOtelTrace(traceId);
  const logs = useOrphanLogs(traceId, spans ?? []);

  // Here we can insert relevant events that happend, in order to link back to the timeline.
  // For now, we're just looking for Neon database queries
  const logsWithEvents = useMemo<LogEntry[]>(() => {
    const neonSpans = spans?.filter((span) => isNeonFetch(span));
    const neonEvents: NeonEvent[] =
      neonSpans?.map((span) => {
        const responseBody = getResponseBody(span);
        const rowCount =
          responseBody && isJson(responseBody)
            ? Number.parseInt(safeParseJson(responseBody)?.rowCount ?? "") ??
              null
            : null;
        return {
          id: span.span_id,
          type: "neon-event",
          timestamp: span.end_time,
          sql: getNeonSqlQuery(span),
          rowCount,
          duration: span.end_time.getTime() - span.start_time.getTime(),
        };
      }) ?? [];

    if (neonEvents?.length) {
      const result = [...logs, ...neonEvents];
      return result.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
    }

    return logs;
  }, [logs, spans]);

  return <LogsTableContent logs={logsWithEvents} />;
};

function LogsTableContent({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="overflow-y-scroll">
      {logs.length === 0 ? (
        <LogsEmptyState />
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <LogsTableRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
