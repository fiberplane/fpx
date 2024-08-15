import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MizuOrphanLog } from "@/queries";
import { OtelSpan } from "@/queries/traces-otel";
import { cn } from "@/utils";
import { useMemo } from "react";
import { EmptyState } from "../EmptyState";
import { TraceDetailsTimeline, TraceDetailsV2 } from "../v2";
import { HttpSummary, SummaryV2 } from "../v2/SummaryV2";
import { getVendorInfo } from "../v2/vendorify-traces";

export type SpanWithVendorInfo = {
  span: OtelSpan;
  vendorInfo: ReturnType<typeof getVendorInfo>;
};

export type Waterfall = Array<SpanWithVendorInfo | MizuOrphanLog>;

const EMPTY_LIST: Array<MizuOrphanLog> = [];

export function RequestDetailsPageContentV2({
  pagination,
  spans,
  orphanLogs = EMPTY_LIST,
}: {
  spans: Array<OtelSpan>;
  orphanLogs?: Array<MizuOrphanLog>;
  pagination?: {
    currentIndex: number;
    maxIndex: number;
    handlePrevTrace: () => void;
    handleNextTrace: () => void;
  };
}) {
  const spansWithVendorInfo: Array<SpanWithVendorInfo> = useMemo(
    () =>
      spans.map((span) => ({
        span,
        vendorInfo: getVendorInfo(span),
      })),
    [spans],
  );

  // HACK - normally we'd look for the root span by trying to find the span with the parent_span_id === null
  //        but we set a fake parent_span_id for the root span in the middleware for now
  const rootSpan = spansWithVendorInfo.find(
    // (item) => item.span.parent_span_id === null,
    (item) => item.span.name === "request",
  );

  const waterfall = useMemo((): Waterfall => {
    return [...spansWithVendorInfo, ...orphanLogs].sort((a, b) => {
      const timeA = "span" in a ? a.span.start_time : a.timestamp;
      const timeB = "span" in b ? b.span.start_time : b.timestamp;
      if (timeA === timeB) {
        // If the times are the same, we need to sort giving the priority to the root span
        if ("span" in a && a?.span?.name === "request") {
          return -1;
        }
        if ("span" in b && b?.span?.name === "request") {
          return 1;
        }
      }
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  }, [spansWithVendorInfo, orphanLogs]);

  if (!rootSpan) {
    return <EmptyState />;
  }

  return (
    <div
      className={cn(
        "h-full",
        "relative",
        "overflow-hidden",
        "overflow-y-auto",
        "grid grid-rows-[auto_1fr]",
        "px-2 pb-4",
        "sm:px-4 sm:pb-8",
        "md:px-6",
      )}
    >
      <div
        className={cn(
          "flex gap-4 items-center justify-between",
          "py-8",
          "sm:gap-6 sm:py-8",
        )}
      >
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-semibold">Request Details</h2>
          <div className="hidden md:block">
            <HttpSummary trace={rootSpan.span} />
          </div>
        </div>
        {pagination && (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={pagination.currentIndex === 0}
                  onClick={pagination.handlePrevTrace}
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-slate-950 text-white"
                align="center"
              >
                Prev <KeyboardShortcutKey>K</KeyboardShortcutKey>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={pagination.currentIndex === pagination.maxIndex}
                  onClick={pagination.handleNextTrace}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-slate-950 text-white"
                align="center"
              >
                Next <KeyboardShortcutKey>J</KeyboardShortcutKey>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <div className={cn("grid grid-rows-[auto_1fr] gap-4")}>
        <SummaryV2 requestSpan={rootSpan.span} />
        <ResizablePanelGroup
          direction="horizontal"
          className={cn("grid grid-rows-[auto_1fr] gap-4 w-full")}
        >
          <ResizablePanel
            defaultSize={20}
            className={cn(
              "hidden",
              "lg:block lg:sticky lg:top-4 self-start",
              "min-w-[300px]",
              "xl:min-w-[260px]",
              "2xl:min-w-[320px]",
            )}
          >
            <TraceDetailsTimeline waterfall={waterfall} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            className={cn(
              "grid items-center gap-4 overflow-x-auto relative",
              "w-full",
              "max-lg:grid-rows-[auto_1fr]",
              "lg:items-start",
              "lg:p-4",
            )}
          >
            <div className="w-full lg:hidden">
              <TraceDetailsTimeline waterfall={waterfall} />
            </div>
            <TraceDetailsV2 waterfall={waterfall} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
