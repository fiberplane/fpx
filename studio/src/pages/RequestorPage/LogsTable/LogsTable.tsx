import { useOrphanLogs } from "@/hooks";
import { useOtelTrace } from "@/queries";
import { LogsEmptyState } from "./Empty";
import { LogsTableRow } from "./LogsTableRow";
import { useLogsWithEvents } from "./data";
import type { LogEntry } from "./types";

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

  // Here we insert relevant events that happened.
  // For now, we're just looking for Neon database queries.
  // Jacco is going to add exceptions, then we should consider additional things like
  // fetches, etc.
  const logsWithEvents = useLogsWithEvents(spans ?? [], logs);

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
