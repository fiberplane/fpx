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
import type { ApiResponse } from "@/types";
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
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { z } from "zod";
import { ErrorBoundary } from "./traces.index";

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code: ({
          children,
          className,
          inline = false,
          ...props
        }: React.HTMLProps<HTMLElement> & {
          inline?: boolean;
        }) => {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "text";

          // Always render inline code with simple styling
          if (inline || !className) {
            return (
              <code
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-sm",
                  "bg-muted text-primary/90",
                )}
                {...props}
              >
                {children}
              </code>
            );
          }

          // Only use SyntaxHighlighter for code blocks with a language
          return (
            <div className="rounded-md overflow-hidden my-4">
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          );
        },
        // Override default link styling
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),
        // Add proper list styling
        ul: ({ children }) => (
          <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>
        ),
        // Add proper heading styles
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>
        ),
      }}
      className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-2 [&>p]:leading-relaxed"
    >
      {content}
    </ReactMarkdown>
  );
}

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
          <Icon icon={`lucide:panel-right-${isOpen ? "close" : "open"}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1.5 flex gap-1.5" align="end">
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
              "fixed right-0 top-0 z-50 grid w-[375px]",
              "gap-4 border bg-background shadow-lg duration-75",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:slide-out-to-right-1/2",
              "data-[state=open]:slide-in-from-right-1/2",
              "sm:rounded-lg",
              "h-full",
              "z-50",
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-4">
                <DialogTitle className="sr-only">Trace Assistant</DialogTitle>
                <DialogDescription className="sr-only">
                  View trace details and analysis
                </DialogDescription>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto p-0.5 w-6 h-6 hover:bg-primary/50"
                  >
                    <Icon icon="lucide:panel-right-close" />
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
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["trace-summary", trace.traceId],
    [trace.traceId],
  );

  const {
    mutate: getSummary,
    data: summaryData,
    isPending,
    isError,
    error,
  } = useTraceSummary();

  // Check cache and request summary when component mounts
  useEffect(() => {
    const cachedData = queryClient.getQueryData(queryKey);
    if (!cachedData) {
      getSummary({ traceId: trace.traceId, spans: trace.spans });
    }
  }, [getSummary, trace.traceId, trace.spans, queryClient, queryKey]);

  // Use cached data if available
  const data =
    queryClient.getQueryData<ApiResponse<{ summary: string }>>(queryKey) ??
    summaryData;

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground/70">
          <Icon icon="lucide:sparkles" className="h-4 w-4 flex-shrink-0" />
          Analysis
        </h3>

        {isPending && !data && (
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
            <div className="flex items-center">
              <Icon icon="lucide:alert-circle" className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Failed to analyze trace. Please try again."}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {!isPending && !isError && (
          <div className="space-y-4 overflow-auto">
            {data?.data.summary ? (
              <div className="break-words">
                <MarkdownRenderer content={data.data.summary} />
              </div>
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
        <ResizablePanel id="trace-main" order={0}>
          <div className="grid grid-cols-1 h-full min-h-0 overflow-hidden overflow-y-auto relative">
            {children}
          </div>
        </ResizablePanel>
        {isLgScreen && sidePanel === "open" && (
          <>
            <ResizableHandle
              hitAreaMargins={{ coarse: 20, fine: 10 }}
              className="w-0 ml-2"
            />
            <ResizablePanel
              id="trace-sidebar"
              order={1}
              minSize={minSize}
              defaultSize={(320 / width) * 100}
            >
              <div className="h-full px-2 py-2">
                <div className="rounded border h-full grid p-4 overflow-hidden">
                  <TraceDetailAssistant trace={trace} />
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
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
            <div className="h-full px-4 overflow-auto">
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
      <div className="overflow-x-hidden h-full pl-2 md:pl-4">
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
