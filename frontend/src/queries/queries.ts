import { QueryClient, QueryClientProvider, useQuery } from "react-query";

import { objectWithKeyAndValue } from "@/utils";
import {
  MizuApiLogResponseSchema,
  type MizuLog,
  type MizuRequestEnd,
  type MizuRequestStart,
  type MizuTrace,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
} from "./types";

export const queryClient = new QueryClient();
export { QueryClientProvider };

export function useMizuTraces() {
  return useQuery({
    queryKey: ["mizuTraces"],
    queryFn: fetchMizuTraces,
  });
}

async function fetchMizuTraces() {
  try {
    const response = await fetch("http://localhost:8788/v0/logs", {
      mode: "cors",
    });
    const responseData = await response.json();
    const { logs: transformedLogs } =
      MizuApiLogResponseSchema.parse(responseData);
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
        const trace = map.get(log.traceId);
        // trace should never be undefined here since we just set it
        trace?.logs.push(log);
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
            objectWithKeyAndValue(a.message, "lifecycle", "response") ||
            objectWithKeyAndValue(b.message, "lifecycle", "request")
          ) {
            return 1;
          }

          if (
            objectWithKeyAndValue(a.message, "lifecycle", "request") ||
            objectWithKeyAndValue(b.message, "lifecycle", "response")
          ) {
            return -1;
          }
        }
        return comparison;
      });

      trace.duration = "TODO";
      trace.description = getTraceDescription(trace);

      const response = trace.logs.find((l) =>
        isMizuRequestEndMessage(l.message),
      ) as (MizuLog & { message: MizuRequestEnd }) | undefined;
      const status = response?.message.status;
      trace.status = typeof status === "string" ? status : "unknown";
      traces.push(trace);
    }

    // Sort traces by most recent to least recent timestamp
    // based off of the first log in the trace
    traces.sort((a, b) =>
      b.logs[0].timestamp.localeCompare(a.logs[0].timestamp),
    );

    return traces;
  } catch (e: unknown) {
    console.error("Error fetching logs: ", e);
  }
}

export function getTraceDescription(trace: MizuTrace) {
  const request = trace.logs.find((l) =>
    isMizuRequestStartMessage(l.message),
  ) as (MizuLog & { message: MizuRequestStart }) | undefined;
  const response = trace.logs.find((l) => isMizuRequestEndMessage(l.message)) as
    | (MizuLog & { message: MizuRequestEnd })
    | undefined;

  const method = request?.message.method;
  const path = request?.message.path;
  const status = request?.message.status;

  if (path === "/favicon.ico" && status === "404") {
    return "favicon not found";
  }

  if (request && response) {
    return `${method} ${path}`;
  }
  return "Unknown trace";
}
