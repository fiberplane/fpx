import type { OtelTrace } from "@/queries";
import { getRequestPath, isFpxRequestSpan } from "@/utils";

export function useMostRecentRequest(
  currentTrace: OtelTrace,
  traces?: OtelTrace[] | null,
) {
  if (!traces) {
    console.debug("Traces are null");
    return {
      isMostRecentTrace: true,
      traceId: currentTrace.traceId,
    };
  }

  const currentTraceIndex = traces.findIndex(
    (trace) => trace.traceId === currentTrace.traceId,
  );

  if (currentTraceIndex === -1) {
    console.debug("Current trace not found in traces array");
    return {
      isMostRecentTrace: true,
      traceId: currentTrace.traceId,
    };
  }

  const currentRequestSpan = currentTrace.spans.find(isFpxRequestSpan);

  if (!currentRequestSpan) {
    console.debug("No request span found in current trace");
    return {
      isMostRecentTrace: true,
      traceId: currentTrace.traceId,
    };
  }

  const currentPath = getRequestPath(currentRequestSpan);

  const mostRecentTrace = traces
    .slice(0, currentTraceIndex + 1)
    .find((trace) => {
      const requestSpan = trace.spans.find(isFpxRequestSpan);

      if (requestSpan) {
        const tracePath = getRequestPath(requestSpan);
        return tracePath === currentPath;
      }

      return false;
    });

  return {
    isMostRecentTrace: mostRecentTrace?.traceId === currentTrace.traceId,
    traceId: mostRecentTrace?.traceId || currentTrace.traceId,
  };
}
