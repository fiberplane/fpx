import { TextOrJsonViewer } from "@/components/ResponseBody";
import {
  type RequestInfo,
  ResponseSummaryContainer,
} from "@/components/ResponseSummary";
import { NavigationPanel } from "@/components/playground/NavigationPanel";
import { NavigationFrame } from "@/components/playground/NavigationPanel";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useIsLgScreen } from "@/hooks";
import { tracesQueryOptions } from "@/lib/hooks/useTraces";
import { cn } from "@/lib/utils";
import type { Trace } from "@/types";
import { parseEmbeddedConfig } from "@/utils";
import {
  getRequestMethod,
  getRequestUrl,
  getStatusCode,
  isIncomingRequestSpan,
} from "@/utils/otel-helpers";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/traces/")({
  component: TracesOverview,
  loader: async ({ context: { queryClient } }) => {
    // TODO - Pull this from the store
    const tracingEnabled = true;
    const response = await queryClient.ensureQueryData(
      tracesQueryOptions(tracingEnabled),
    );
    return { traces: response.data };
  },
  onError: (error) => {
    console.error("Error loading traces", error);
  },
  errorComponent: ErrorBoundary,
});

function TracesOverview() {
  const loaderData = Route.useLoaderData();
  const { traces } = loaderData;

  if (!traces || traces?.length === 0) {
    return (
      <TraceListLayout>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <h2 className="mb-2 text-lg font-medium">No traces found</h2>
          <p className="text-sm text-muted-foreground">
            Make a request to get started
          </p>
        </div>
      </TraceListLayout>
    );
  }

  return (
    <TraceListLayout>
      <div className="h-full p-4 overflow-y-auto">
        <h2 className="mb-4 text-lg font-medium">
          Traces ({traces.length} total)
        </h2>
        <div className="grid gap-2">
          {traces.map((trace: Trace) => {
            const rootSpan = trace.spans.find((span) =>
              isIncomingRequestSpan(span),
            );
            if (!rootSpan) {
              return null;
            }

            const responseStatusCode = getStatusCode(rootSpan) || 200;
            const response: RequestInfo = {
              requestMethod: getRequestMethod(rootSpan) || "GET",
              requestUrl: getRequestUrl(rootSpan) || "",
              responseStatusCode,
            };

            // Skip traces that don't have HTTP info
            if (!response.requestMethod || !response.requestUrl) {
              return null;
            }

            return (
              <Link
                key={trace.traceId}
                to="/traces/$traceId"
                params={{ traceId: trace.traceId }}
                className="block transition-colors hover:no-underline"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <ResponseSummaryContainer response={response} dimmed />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{trace.spans.length} spans</span>
                        <span>
                          {new Date(rootSpan.start_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </TraceListLayout>
  );
}

function getMainSectionWidth() {
  return window.innerWidth - 85;
}

function TraceListLayout({ children }: { children: React.ReactNode }) {
  const [sidePanel] = useState<"open" | "closed">("open");
  const isLgScreen = useIsLgScreen();
  const width = getMainSectionWidth();

  // Panel constraints for responsive layout
  const minSize = (320 / width) * 100;
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      {isLgScreen && sidePanel === "open" && (
        <>
          <ResizablePanel
            id="sidebar"
            order={0}
            minSize={minSize}
            defaultSize={(320 / width) * 100}
          >
            <NavigationFrame>
              <NavigationPanel />
            </NavigationFrame>
          </ResizablePanel>
          <ResizableHandle
            hitAreaMargins={{ coarse: 20, fine: 10 }}
            className="w-0 mr-2"
          />
        </>
      )}
      <ResizablePanel id="main" order={1}>
        <div className="grid grid-cols-1 h-full min-h-0 overflow-hidden overflow-y-auto relative">
          {children}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function ErrorBoundary(props: {
  error: Error;
}) {
  const { error } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { mountedPath, openapi, parseError } = useDebugInfo();

  // TODO - Make more friendly errors
  const message = error.message;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h2 className="mb-2 text-lg font-medium">Error loading traces</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex flex-col gap-4 mt-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <span className="text-muted-foreground">Debug Info</span>
            <Icon
              icon="lucide:chevron-down"
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="grid gap-2">
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    MOUNTED_PATH
                  </p>
                  <code className="text-sm">{mountedPath}</code>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    OPENAPI
                  </p>
                  <TextOrJsonViewer text={JSON.stringify(openapi, null, 2)} />
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    PARSE_ERROR
                  </p>
                  <code className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(parseError, null, 2)}
                  </code>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    LOADER_ERROR
                  </p>
                  <code className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(error, null, 2)}
                  </code>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

type DebugInfo = {
  mountedPath: string | undefined | null;
  openapi: Record<string, unknown> | undefined | null;
  parseError: Error | null | unknown;
};

function useDebugInfo(): DebugInfo {
  return useMemo(() => {
    try {
      const rootElement = document.getElementById("root");
      if (!rootElement) {
        return {
          mountedPath: null,
          openapi: null,
          parseError: { message: "Root element not found" },
        };
      }
      return {
        ...parseEmbeddedConfig(rootElement),
        parseError: null,
      };
    } catch (parseError) {
      return {
        mountedPath: null,
        openapi: null,
        parseError,
      };
    }
  }, []);
}
