import {
  TimelineGraph,
  TimelineListDetails,
  TimelineProvider,
  extractWaterfallTimeStats,
} from "@/components/Timeline";
import { useAsWaterfall } from "@/components/Timeline/hooks/useAsWaterfall";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useIsSmScreen } from "@/hooks";
import { useOtelTrace } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Tabs } from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { useOrphanLogs } from "../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "./Tabs";
import { useRequestorStore } from "./store";

type Props = {
  traceId?: string;
};

export function RequestorTimeline({ traceId = "" }: Props) {
  const { data: spans } = useOtelTrace(traceId);
  const { togglePanel } = useRequestorStore("togglePanel");
  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useAsWaterfall(spans ?? [], orphanLogs);
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);
  const isSmallScreen = useIsSmScreen();

  const { minSize } = usePanelConstraints({
    groupId: isSmallScreen ? "" : "requestor-timeline",
    initialGroupSize: 600,
    minimalGroupSize: 624,
    minPixelSize: 300,
  });

  return (
    <RequestorTimelineInner
      traceId={traceId}
      togglePanel={togglePanel}
      waterfall={waterfall}
      minStart={minStart}
      duration={duration}
      isSmallScreen={isSmallScreen}
      minSize={minSize ?? 0}
    />
  );
}

type InnerProps = {
  traceId: string;
  togglePanel: (panelName: "timelinePanel") => void;
  waterfall: ReturnType<typeof useAsWaterfall>["waterfall"];
  minStart: number;
  duration: number;
  isSmallScreen: boolean;
  minSize: number;
};

function RequestorTimelineInner({
  traceId,
  togglePanel,
  waterfall,
  minStart,
  duration,
  isSmallScreen,
  minSize,
}: InnerProps) {
  return (
    <Tabs defaultValue="timeline" className="h-full">
      <CustomTabsList className="sticky top-0 z-10">
        <CustomTabTrigger value="timeline">Timeline</CustomTabTrigger>
        <div className="flex-grow flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePanel("timelinePanel")}
            className="h-6 w-6"
          >
            <Cross1Icon className="h-3 w-3 cursor-pointer" />
          </Button>
        </div>
      </CustomTabsList>
      <CustomTabsContent
        value="timeline"
        className="overflow-hidden md:overflow-hidden"
      >
        {waterfall.length === 0 ? (
          <TimelineEmptyState />
        ) : (
          <TimelineProvider>
            <ResizablePanelGroup
              direction="horizontal"
              id="requestor-timeline"
              className="h-full"
            >
              {!isSmallScreen && (
                <>
                  <ResizablePanel
                    minSize={minSize}
                    defaultSize={25}
                    order={0}
                    id="graph"
                  >
                    <Content className="pr-3 sticky top-0">
                      <TimelineGraph
                        waterfall={waterfall}
                        minStart={minStart}
                        duration={duration}
                        activeId={traceId ?? ""}
                      />
                    </Content>
                  </ResizablePanel>
                  <ResizableHandle hitAreaMargins={{ coarse: 20, fine: 10 }} />
                </>
              )}
              <ResizablePanel className="" order={1} id="details">
                <Content className="overflow-y-auto h-full">
                  <TimelineListDetails waterfall={waterfall} />
                </Content>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TimelineProvider>
        )}
      </CustomTabsContent>
    </Tabs>
  );
}

function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300">
      <div className="p-8 rounded-lg flex flex-col items-center max-w-md text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:align-start-vertical"
            strokeWidth="1px"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">No timeline data found</h2>
        <p className="text-gray-400 mb-4 text-sm">
          There is currently no timeline data to display. This could be because
          no events have been recorded yet, or the trace data is not available.
        </p>
      </div>
    </div>
  );
}

const Content = (props: { className?: string; children: ReactNode }) => (
  <div className={cn("mt-2 px-3 py-2 min-h-[10rem]", props.className)}>
    {props.children}
  </div>
);
