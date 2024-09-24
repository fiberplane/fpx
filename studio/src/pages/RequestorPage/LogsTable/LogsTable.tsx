import { useOrphanLogs } from "@/hooks";
import { type MizuOrphanLog, useOtelTrace } from "@/queries";
import { LogsEmptyState } from "./Empty";
import { LogRow } from "./LogsTableRow";

type Props = {
  traceId?: string;
};

const EMPTY_LIST: MizuOrphanLog[] = [];

export function LogsTable({ traceId }: Props) {
  if (!traceId) {
    return <LogsTableContent logs={EMPTY_LIST} />;
  }

  return <LogsTableWithTraceId traceId={traceId} />;
}

const LogsTableWithTraceId = ({ traceId }: { traceId: string }) => {
  const { data: spans } = useOtelTrace(traceId);
  const logs = useOrphanLogs(traceId, spans ?? []);

  return <LogsTableContent logs={logs} />;
};

function LogsTableContent({ logs }: { logs: MizuOrphanLog[] }) {
  return (
    <div className="overflow-y-scroll">
      {logs.length === 0 ? (
        <LogsEmptyState />
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
