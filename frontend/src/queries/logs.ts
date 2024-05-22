import { useEffect, useState } from "react";
import { MizuLog, MizuTrace, transformToLog } from "./decoders";

export function useMizulogs() {
  const [logs, setLogs] = useState([] as Array<MizuLog>)
  const [traces, setTraces] = useState([] as Array<MizuTrace>)
  useEffect(() => {
    fetch("http://localhost:8788/v0/logs", { mode: "cors" }).then(r => r.json())
      .then(j => {
        const transformedLogs: Array<MizuLog> = j.logs.map(transformToLog)
        transformedLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setLogs(transformedLogs)
        const tracesMap: Map<string, MizuTrace> = transformedLogs.reduce((map: Map<string, MizuTrace>, log: MizuLog) => {
          if (!map.has(log.traceId)) {
            map.set(log.traceId, {
              description: "",
              status: "",
              duration: "",
              logs: [] as Array<MizuLog>,
            })
          }
          map.get(log.traceId)!.logs.push(log)
          return map
        }, new Map<string, MizuTrace>());

        const traces: Array<MizuTrace> = []
        for (const [, trace] of tracesMap.entries()) {
          trace.duration = "TODO";
          trace.description = "TODO";
          trace.logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
          const response = trace.logs.find(l => l.message?.lifecycle === "response");
          trace.status = response.message?.status ?? "unknown";
          traces.push(trace);
        }

        // Sort traces by most recent to least recent timestamp
        // based off of the first log in the trace
        traces.sort((a, b) => b.logs[0].timestamp.localeCompare(a.logs[0].timestamp));

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
