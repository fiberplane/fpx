import { QueryClient, QueryClientProvider, useQuery } from "react-query";

export const queryClient = new QueryClient();
export { QueryClientProvider };

import { MizuLog, MizuTrace, transformToLog } from "./decoders";

export function useMizuTraces() {
  return useQuery({ queryKey: ["mizuTraces"], queryFn: fetchMizuTraces });
}

export function fetchMizuTraces() {
  return fetch("http://localhost:8788/v0/logs", { mode: "cors" })
    .then((r) => r.json())
    .then((j) => {
      const transformedLogs: Array<MizuLog> = j.logs.map(transformToLog);
      transformedLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const tracesMap: Map<string, MizuTrace> = transformedLogs.reduce(
        (map: Map<string, MizuTrace>, log: MizuLog) => {
          if (!map.has(log.traceId)) {
            map.set(log.traceId, {
              id: log.traceId,
              description: "",
              status: "",
              duration: "",
              logs: [] as Array<MizuLog>,
            });
          }
          map.get(log.traceId)!.logs.push(log);
          return map;
        },
        new Map<string, MizuTrace>(),
      );

      const traces: Array<MizuTrace> = [];
      for (const [, trace] of tracesMap.entries()) {
        trace.logs.sort((a, b) => {
          const comparison = a.timestamp.localeCompare(b.timestamp);
          // HACK - tie-breaking logic for logs with the same timestamp, defer to the lifecycle field
          if (comparison === 0) {
            if (
              a.message?.lifecycle === "response" ||
              b.message?.lifecycle === "request"
            ) {
              return 1;
            }
            if (
              a.message?.lifecycle === "request" ||
              b.message?.lifecycle === "response"
            ) {
              return -1;
            }
          }
          return comparison;
        });

        trace.duration = "TODO";
        trace.description = getTraceDescription(trace);

        const response = trace.logs.find(
          (l) => l.message?.lifecycle === "response",
        );
        trace.status = response?.message?.status ?? "unknown";
        traces.push(trace);
      }

      // Sort traces by most recent to least recent timestamp
      // based off of the first log in the trace
      traces.sort((a, b) =>
        b.logs[0].timestamp.localeCompare(a.logs[0].timestamp),
      );

      return traces;
    })
    .catch((e: unknown) => {
      console.error("Error fetching logs: ", e);
      if (e instanceof Error) {
        alert(`Error fetching logs: ${e.message}`);
      }
    });
}

function getTraceDescription(trace: MizuTrace) {
  const request = trace.logs.find((l) => l.message?.lifecycle === "request");
  const response = trace.logs.find((l) => l.message?.lifecycle === "response");

  const method = request?.message?.method;
  const path = response?.message?.path;
  const status = response?.message?.status;

  if (path === "/favicon.ico" && status === "404") {
    return "favicon not found";
  }

  if (request && response) {
    return `${method} ${path}`;
  }
  return "Unknown trace";
}

