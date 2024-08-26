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
import type { MizuOrphanLog } from "@/queries";
import { type OtelSpan, useOtelTraces } from "@/queries/traces-otel";
import { cn, isMac } from "@/utils";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../EmptyState";
import {
  useMostRecentRequest,
  useReplayRequest,
  useShouldReplay,
} from "../hooks";
import { TraceDetailsTimeline, TraceDetailsV2 } from "../v2";
import { HttpSummary, SummaryV2 } from "../v2/SummaryV2";
import type { getVendorInfo } from "../v2/vendorify-traces";
import { useRequestWaterfall } from "./useRequestWaterfall";

export type SpanWithVendorInfo = {
  span: OtelSpan;
  vendorInfo: ReturnType<typeof getVendorInfo>;
};

export type Waterfall = Array<SpanWithVendorInfo | MizuOrphanLog>;

const EMPTY_LIST: Array<MizuOrphanLog> = [];

export function RequestDetailsPageContentV2({
  traceId,
  pagination,
  spans,
  orphanLogs = EMPTY_LIST,
}: {
  traceId: string;
  spans: Array<OtelSpan>;
  orphanLogs?: Array<MizuOrphanLog>;
  pagination?: {
    currentIndex: number;
    maxIndex: number;
    handlePrevTrace: () => void;
    handleNextTrace: () => void;
  };
}) {
  const currentTrace = {
    traceId,
    spans,
  };
  const { data: traces } = useOtelTraces();

  useEffect(() => {
    console.log(traces);
  }, [traces]);

  const { isMostRecentTrace, traceId: mostRecentTraceId } =
    useMostRecentRequest(currentTrace, traces);

  const { rootSpan, waterfall } = useRequestWaterfall(spans, orphanLogs);

  const shouldReplay = useShouldReplay(currentTrace);

  const { replay, isReplaying } = useReplayRequest({ span: rootSpan!.span });

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
            <div></div>
          </div>
        </div>
        <div></div>
        <div className="flex gap-2 items-center">
          {!isMostRecentTrace && (
            <Link
              className="text-blue-600 pr-4"
              to={`/requests/otel/${mostRecentTraceId}`}
            >
              View most recent response ↗
            </Link>
          )}
          {shouldReplay && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  disabled={isReplaying}
                  onClick={replay}
                >
                  Replay
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                sideOffset={15}
                className={cn(
                  "bg-slate-900 ",
                  "text-muted-foreground",
                  "px-2",
                  "py-1.5",
                  "gap-1.5",
                  "text-sm",
                  "flex",
                  "items-center",
                )}
                align="center"
              >
                <p>Replay request</p>
                <div className="flex gap-1">
                  <KeyboardShortcutKey>
                    {isMac ? "⌘" : "Ctrl"}
                  </KeyboardShortcutKey>{" "}
                  <KeyboardShortcutKey>Enter</KeyboardShortcutKey>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
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
                  className="bg-slate-900 text-white px-2 py-1.5 gap-1.5"
                  align="center"
                >
                  <p>Prev</p>
                  <KeyboardShortcutKey>K</KeyboardShortcutKey>
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
                  className="bg-slate-900 text-white px-2 py-1.5 gap-1.5"
                  align="center"
                >
                  <p>Next</p>
                  <KeyboardShortcutKey>J</KeyboardShortcutKey>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      <div className={cn("grid grid-rows-[auto_1fr] gap-4")}>
        <SummaryV2 requestSpan={rootSpan.span} />
        <div className="min-w-0 overflow-hidden w-full lg:hidden">
          <TraceDetailsTimeline waterfall={waterfall} />
        </div>
        <ResizablePanelGroup
          direction="horizontal"
          className={cn("grid grid-rows-[auto_1fr] w-full border-t")}
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
            <TraceDetailsTimeline waterfall={waterfall} className="lg:pt-0" />
          </ResizablePanel>
          <ResizableHandle className="max-lg:hidden" />
          <ResizablePanel
            className={cn(
              "grid items-center gap-4 overflow-x-auto relative",
              "w-full",
              "lg:items-start",
              "lg:p-4",
            )}
          >
            <TraceDetailsV2 waterfall={waterfall} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
