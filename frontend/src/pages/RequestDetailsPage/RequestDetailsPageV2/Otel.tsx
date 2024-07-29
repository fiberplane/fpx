// import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
// import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";

import {
  //  OtelSpan, OtelSpans,
  useOtelTrace,
} from "@/queries/traces-otel";
// import { cn } from "@/utils";
import { EmptyState } from "../EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
// import { Button } from "@/components/ui/button";
// import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
// import { TraceDetailsTimeline, TraceDetailsV2 } from "../v2";
// import { HttpSummary, SummaryV2 } from "../v2/SummaryV2";
// import { MizuLog } from "@/queries";
import { RequestDetailsPageContentV2 } from "./RequestDetailsPageV2Content";
// import { usePagination } from "../hooks";
// import { useMemo } from "react";
// import { MizuOrphanLog, MizuTraceV2, type MizuSpan } from "@/queries";

export function Otel({
  traceId,
}: {
  traceId: string;
}) {
  // const { data: spans, isPending, error } = useOtelTrace(traceId);

  const { data: spans, isPending, error } = useOtelTrace(traceId);
  // const rootSpan = spans?.find((span) => span.parent_span_id === null);

  // usePagination()

  if (error) {
    console.error("Error!", error);
  }
  // const tracesV2 = useMemo((): MizuTraceV2 | undefined => {
  //   if (!data) {
  //     return undefined;
  //   }

  //   // const spans = data.filter(span => span.trace_id !== traceId);
  //   if (!rootSpan) {
  //     return undefined;
  //   }

  //   console.log('rootSpan', rootSpan);
  //   const endTime = new Date(rootSpan.end_time);
  //   const startTime = new Date(rootSpan.start_time);
  //   return ({
  //     ...rootSpan,
  //     spans: [] as Array<MizuSpan>,
  //     waterfall: [],
  //     orphanLogs: [] as Array<MizuOrphanLog>,
  //     duration: `${(endTime.getTime() - startTime.getTime()).toString()}ms`,
  //     id: rootSpan.span_id,
  //     method: rootSpan.attributes["http.method"]?.toString() ?? "",
  //     // logs:

  //   });
  // }, [data, traceId])

  if (isPending) {
    return <SkeletonLoader />;
  }

  if (!spans) {
    return <EmptyState />;
  }

  return (
    <RequestDetailsPageContentV2
      spans={spans}
      // rootSpan={rootSpan}
    />
  );
}
