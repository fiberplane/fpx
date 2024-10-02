import {
  ArrowTopRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import {
  TimelineListDetails,
  extractWaterfallTimeStats,
} from "@/components/Timeline";
import { useAsWaterfall } from "@/components/Timeline/hooks/useAsWaterfall";
import { Button } from "@/components/ui/button";
import type { MizuOrphanLog } from "@/queries";
import { useOtelTraces } from "@/queries/traces-otel";
import { cn, isMac } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link } from "react-router-dom";
import { EmptyState } from "../EmptyState";
import {
  useMostRecentRequest,
  useReplayRequest,
  useShouldReplay,
} from "../hooks";
import { HttpSummary, SummaryV2 } from "../v2/SummaryV2";

const EMPTY_LIST: Array<MizuOrphanLog> = [];

export function RequestDetailsPageContentV2({
  traceId,
  pagination,
  spans,
  orphanLogs = EMPTY_LIST,
  generateLinkToTrace,
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
  generateLinkToTrace: (traceId: string) => string;
}) {
  const currentTrace = {
    traceId,
    spans,
  };
  const { data: traces } = useOtelTraces();

  const { isMostRecentTrace, traceId: mostRecentTraceId } =
    useMostRecentRequest(currentTrace, traces);

  const { rootSpan, waterfall } = useAsWaterfall(spans, orphanLogs);
  const { minStart, duration } = useMemo(
    () => extractWaterfallTimeStats(waterfall),
    [waterfall],
  );

  const shouldReplay = useShouldReplay(currentTrace);

  const { replay, isReplaying } = useReplayRequest({ span: rootSpan?.span });

  const replayRef = useRef<HTMLButtonElement>(null);

  useHotkeys(["mod+enter"], () => {
    if (replayRef.current && shouldReplay) {
      replayRef.current.click();
    }
  });

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
          <div className="hidden lg:block">
            <HttpSummary trace={rootSpan.span} />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {!isMostRecentTrace && (
            <Link
              className="text-blue-600 pr-4 text-sm inline-flex items-center gap-1.5"
              to={generateLinkToTrace(mostRecentTraceId)}
            >
              Jump to latest
              <ArrowTopRightIcon className="w-3.5 h-3.5" />
            </Link>
          )}
          {shouldReplay && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  disabled={isReplaying}
                  onClick={replay}
                  ref={replayRef}
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
        <TimelineListDetails
          waterfall={waterfall}
          duration={duration}
          minStart={minStart}
        />
      </div>
    </div>
  );
}
