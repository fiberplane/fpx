// // import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

// import { useHotkeys } from "react-hotkeys-hook";
// import { useEffect } from "react";
import { Hackadoodle } from "./Hackadoodle";
// import { useNavigate } from "react-router-dom";
import { Otel } from "./Otel";

// // import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
export function RequestDetailsPageV2(props: {
  traceId: string;
  otel: boolean;
}) {
  const { traceId, otel } = props;

  if (otel) {
    return <Otel traceId={traceId} />;
  }

  return <Hackadoodle traceId={traceId} />;
}
// import { OtelSpans, useOtelTrace } from "@/queries/traces-otel";
// import { cn } from "@/utils";
// import { EmptyState } from "../EmptyState";
// import { SkeletonLoader } from "../SkeletonLoader";
// // import { Button } from "@/components/ui/button";
// // import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
// import { TraceDetailsTimeline, TraceDetailsV2 } from "../v2";
// import { HttpSummary, SummaryV2 } from "../v2/SummaryV2";
// // import { useMemo } from "react";
// // import { MizuOrphanLog, MizuTraceV2, type MizuSpan } from "@/queries";

// export function RequestDetailsPageV2({
//   traceId,
//   // currIdx, traces
// }: { traceId: string; currIdx?: number; traces: Array<OtelSpans> }) {
//   const { data: spans, isPending, error } = useOtelTrace(traceId);

//   if (error) {
//     console.error("Error!", error);
//   }

//   const rootSpan = spans?.find((span) => span.parent_span_id === null);
//   // const tracesV2 = useMemo((): MizuTraceV2 | undefined => {
//   //   if (!data) {
//   //     return undefined;
//   //   }

//   //   // const spans = data.filter(span => span.trace_id !== traceId);
//   //   if (!rootSpan) {
//   //     return undefined;
//   //   }

//   //   console.log('rootSpan', rootSpan);
//   //   const endTime = new Date(rootSpan.end_time);
//   //   const startTime = new Date(rootSpan.start_time);
//   //   return ({
//   //     ...rootSpan,
//   //     spans: [] as Array<MizuSpan>,
//   //     waterfall: [],
//   //     orphanLogs: [] as Array<MizuOrphanLog>,
//   //     duration: `${(endTime.getTime() - startTime.getTime()).toString()}ms`,
//   //     id: rootSpan.span_id,
//   //     method: rootSpan.attributes["http.method"]?.toString() ?? "",
//   //     // logs:

//   //   });
//   // }, [data, traceId])

//   if (isPending) {
//     return <SkeletonLoader />;
//   }

//   if (!spans || !rootSpan) {
//     return <EmptyState />;
//   }

//   return (
//     <div
//       className={cn(
//         "h-full",
//         "relative",
//         "overflow-hidden",
//         "overflow-y-auto",
//         "grid grid-rows-[auto_1fr]",
//         "px-2 pb-4",
//         "sm:px-4 sm:pb-8",
//         "md:px-6",
//       )}
//     >
//       <div
//         className={cn(
//           "flex gap-4 items-center justify-between",
//           "py-8",
//           "sm:gap-6 sm:py-8",
//         )}
//       >
//         <div className="flex items-center gap-6">
//           <h2 className="text-2xl font-semibold">Request Details</h2>
//           <div className="hidden md:block">
//             <HttpSummary trace={rootSpan} />
//           </div>
//         </div>
//         {/* <div className="flex gap-2">
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="secondary"
//                 size="icon"
//                 disabled={currIdx === 0}
//                 onClick={handlePrevTrace}
//               >
//                 <ChevronUpIcon className="w-4 h-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent
//               side="left"
//               className="bg-slate-950 text-white"
//               align="center"
//             >
//               Prev <KeyboardShortcutKey>K</KeyboardShortcutKey>
//             </TooltipContent>
//           </Tooltip>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="secondary"
//                 size="icon"
//                 disabled={!traces || currIdx === traces?.length - 1}
//                 onClick={handleNextTrace}
//               >
//                 <ChevronDownIcon className="w-4 h-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent
//               side="bottom"
//               className="bg-slate-950 text-white"
//               align="center"
//             >
//               Next <KeyboardShortcutKey>J</KeyboardShortcutKey>
//             </TooltipContent>
//           </Tooltip>
//         </div> */}
//       </div>
//       <div className={cn("grid grid-rows-[auto_1fr] gap-4")}>
//         <SummaryV2 trace={rootSpan} />
//         <div className="grid lg:grid-cols-[auto_1fr] border-t">
//           <div
//             className={cn(
//               "hidden",
//               "lg:block lg:sticky lg:top-4 self-start",
//               "min-w-[300px]",
//               "xl:min-w-[360px]",
//               "2xl:min-w-[420px]",
//             )}
//           >
//             {/* <TraceDetailsTimeline trace={rootSpan} /> */}
//             <TraceDetailsTimeline
//               root={rootSpan}
//               spans={spans}
//               orphanLogs={[]}
//             />
//           </div>
//           <div
//             className={cn(
//               "grid items-center gap-4 overflow-x-auto relative",
//               "max-lg:grid-rows-[auto_1fr]",
//               "lg:border-l",
//               "lg:items-start",
//               "lg:p-4",
//             )}
//           >
//             <div className="w-full lg:hidden">
//               <TraceDetailsTimeline
//                 root={rootSpan}
//                 spans={spans}
//                 orphanLogs={[]}
//               />
//             </div>
//             <TraceDetailsV2
//               spans={spans}
//               // orphanLogs={[]}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
