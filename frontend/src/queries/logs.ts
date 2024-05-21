import { useEffect, useState } from "react";
import { MizuLog, MizuTrace, transformToLog } from "./decoders";

export function useMizulogs() {
  const [logs, setLogs] = useState([] as Array<MizuLog>)
  const [traces, setTraces] = useState([] as Array<MizuTrace>)
  useEffect(() => {
    fetch("http://localhost:8788/v0/logs", { mode: "cors" }).then(r => r.json())
      .then(j => {
        const transformedLogs = j.logs.map(transformToLog)
        setLogs(transformedLogs)
        const traces = Array.from(transformedLogs.reduce((map: Map<string, MizuTrace>, log: MizuLog) => {
          if (!map.has(log.traceId)) {
            map.set(log.traceId, [])
          }
          map.get(log.traceId)!.push(log)
          return map
        }, new Map<string, MizuTrace>()).values());
        traces.forEach(t => t.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        setTraces(traces);
      }).catch((e: unknown) => {
        console.error("Error fetching logs: ", e);
        if (e instanceof Error) {
          alert(`Error fetching logs: ${e.message}`);
        }
      })
  }, [])

  return { logs, traces };
}
