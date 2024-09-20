import { useActiveTraceId } from "@/hooks/useActiveTraceId";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useOrphanLogs } from "@/hooks";
import { useOtelTrace } from "@/queries";
import { trace } from "console";


const EMPTY_LIST: OtelSpan[] = [];
export function LogsLabel(props: { traceId?: string }) {
  const { traceId } = props;
  console.log("hasTraceID", !!traceId)
  return <div>
    logs
    {traceId && <>{" "}<LogsCount traceId={traceId} /></>}
  </div>;
}

function LogsCount(props: { traceId: string }) {
  const { traceId } = props;
  const { data: spans } = useOtelTrace(traceId);
  const orphanLogs = useOrphanLogs(traceId, spans ?? EMPTY_LIST);
  console.log('logs count', orphanLogs, spans, traceId);
  return <span className="text-xs text-muted-foreground">({orphanLogs.length})</span>
}
