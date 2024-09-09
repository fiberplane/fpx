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
import { Cross1Icon } from "@radix-ui/react-icons";
import { Tabs } from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { useOrphanLogs } from "../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "./Tabs";
import type { Panels } from "./types";

type Props = {
  traceId: string;
  togglePanel: (panelName: keyof Panels) => void;
};

export function RequestorTimeline({ traceId, togglePanel }: Props) {
  const { data: spans } = useOtelTrace(traceId);

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
    <Tabs defaultValue="timeline" className="h-full">
      <CustomTabsList className="sticky top-0 z-10">
        <CustomTabTrigger value="timeline">Timeline</CustomTabTrigger>
        <div className="flex-grow flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePanel("timeline")}
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
                      activeId=""
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
      </CustomTabsContent>
    </Tabs>
  );
}

const Content = (props: { className?: string; children: ReactNode }) => (
  <div className={cn("mt-2 px-3 py-2 min-h-[10rem]", props.className)}>
    {props.children}
  </div>
);
