import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { useAsWaterfall } from "@/components/Timeline";
import { TimelineListDetails } from "@/components/Timeline";
import { extractWaterfallTimeStats } from "@/components/Timeline/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsLgScreen, useOrphanLogs } from "@/hooks";
import { useTraceSummary } from "@/lib/hooks/useTraceSummary";
import { traceQueryOptions } from "@/lib/hooks/useTraces";
import { cn } from "@/utils";
import { isMac } from "@/utils";
import type { TraceDetailSpansResponse } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Root,
} from "@radix-ui/react-dialog";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { z } from "zod";
import { ErrorBoundary } from "./traces.index";

// Helper to get main section width for panel calculations
function getMainSectionWidth() {
  return window.innerWidth - 85;
}

function TraceDetailSidePanelTrigger({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-0.5 w-6 h-6 hover:bg-secondary hover:text-secondary-foreground"
          onClick={onClick}
        >
          <Icon icon={`lucide:panel-left-${isOpen ? "close" : "open"}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1.5 flex gap-1.5" align="start">
        Open Side Panel
        <div className="flex gap-0.5">
          <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
          <KeyboardShortcutKey>B</KeyboardShortcutKey>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function TraceDetailFloatingSidePanel({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <aside>
      <Root open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="fixed top-0 left-0 w-full h-full bg-black/40" />
          <DialogContent
            className={cn(
              "fixed left-0 top-0 z-50 grid w-[375px]",
              "gap-4 border bg-background shadow-lg duration-75",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:slide-out-to-left-1/2",
              "data-[state=open]:slide-in-from-left-1/2",
              "sm:rounded-lg",
              "h-full",
              "z-50",
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-4">
                <DialogTitle>Trace Assistant</DialogTitle>
                <DialogDescription className="sr-only">
                  View trace details and analysis
                </DialogDescription>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
                    <Icon icon="lucide:panel-left-close" />
                  </Button>
                </DialogClose>
              </div>
              {children}
            </div>
          </DialogContent>
        </DialogPortal>
      </Root>
    </aside>
  );
}

function TraceDetailAssistant({
  trace,
}: { trace: { traceId: string; spans: TraceDetailSpansResponse } }) {
  const {
    mutate: getSummary,
    data: summaryData,
    isPending,
    isError,
    error,
  } = useTraceSummary();

  // Request summary when component mounts
  useEffect(() => {
    getSummary({ traceId: trace.traceId, spans: trace.spans });
  }, [getSummary, trace.traceId, trace.spans]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Analysis</h3>

        {isPending && (
          <div className="space-y-2 animate-pulse">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Skeleton className="h-4 w-[90%]" />
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Skeleton className="h-4 w-[85%]" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-4 w-[40%]" />
            </div>
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <Icon icon="lucide:alert-circle" className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to analyze trace. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        {!isPending && !isError && (
          <div className="text-sm text-muted-foreground space-y-4">
            {summaryData?.data.summary ? (
              <>
                <div className="flex items-start gap-2">
                  <Icon
                    icon="lucide:sparkles"
                    className="h-4 w-4 mt-1 flex-shrink-0"
                  />
                  <div className="space-y-2">
                    {summaryData.data.summary
                      .split("\n")
                      .map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <Icon
                  icon="lucide:check-circle"
                  className="h-4 w-4 mt-1 flex-shrink-0"
                />
                <span>No issues found in this trace.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TraceDetailLayout({
  children,
  trace,
}: {
  children: React.ReactNode;
  trace: { traceId: string; spans: TraceDetailSpansResponse };
}) {
  const [sidePanel, setSidePanel] = useState<"open" | "closed">("open");
  const isLgScreen = useIsLgScreen();
  const width = getMainSectionWidth();

  // Panel constraints for responsive layout
  const minSize = (320 / width) * 100;

  const toggleSidePanel = useHandler(() => {
    setSidePanel((prev) => (prev === "open" ? "closed" : "open"));
  });

  useHotkeys("mod+b", toggleSidePanel);

  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="w-full">
        {isLgScreen && sidePanel === "open" && (
          <>
            <ResizablePanel
              id="trace-sidebar"
              order={0}
              minSize={minSize}
              defaultSize={(320 / width) * 100}
            >
              <div className="h-full px-2 py-2">
                <div className="rounded border h-full grid p-4">
                  <TraceDetailAssistant trace={trace} />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle
              hitAreaMargins={{ coarse: 20, fine: 10 }}
              className="w-0 mr-2"
            />
          </>
        )}
        <ResizablePanel id="trace-main" order={1}>
          <div className="grid grid-cols-1 h-full min-h-0 overflow-hidden overflow-y-auto relative">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Floating trigger for mobile */}
      {!isLgScreen && (
        <>
          <TraceDetailSidePanelTrigger
            isOpen={sidePanel === "open"}
            onClick={toggleSidePanel}
          />
          <TraceDetailFloatingSidePanel
            open={sidePanel === "open"}
            onOpenChange={(open) => setSidePanel(open ? "open" : "closed")}
          >
            <div className="h-full p-6">
              <TraceDetailAssistant trace={trace} />
            </div>
          </TraceDetailFloatingSidePanel>
        </>
      )}
    </>
  );
}

export const Route = createFileRoute("/traces/$traceId")({
  validateSearch: z.object({
    spanId: z.string().optional(),
  }),
  component: TraceDetail,
  loader: async ({
    context: { queryClient, fpxEndpointHost },
    params: { traceId },
  }) => {
    const response = await queryClient.ensureQueryData(
      traceQueryOptions(fpxEndpointHost ?? "", traceId),
    );
    return { trace: { traceId, spans: response.data } };
  },
  errorComponent: ErrorBoundary,
});

function TraceDetail() {
  const { trace } = Route.useLoaderData();
  const { traceId, spans } = trace;
  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useAsWaterfall(spans ?? [], orphanLogs);
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);

  if (!trace?.spans || !trace?.spans?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="mb-2 text-lg font-medium">Trace not found</h2>
      </div>
    );
  }

  return (
    <TraceDetailLayout trace={trace}>
      <div className="overflow-x-hidden h-full">
        <h2 className="text-lg font-normal mb-4 py-2 text-foreground/80 border-b border-muted-foreground/20">
          Request Timeline
        </h2>
        <TimelineListDetails
          waterfall={waterfall}
          minStart={minStart}
          duration={duration}
        />
      </div>
    </TraceDetailLayout>
  );
}
