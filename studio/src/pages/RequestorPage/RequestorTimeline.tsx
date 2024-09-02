import {
  TimelineGraph,
  TimelineListDetails,
  TimelineProvider,
  extractWaterfallTimeStats,
} from "@/components/Timeline";
import { useAsWaterfall } from "@/components/Timeline/hooks/useAsWaterfall";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useIsSmScreen } from "@/hooks";
import { useOtelTrace } from "@/queries";
import { cn } from "@/utils";
import type { ReactNode } from "react";
import { useOrphanLogs } from "../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";

type Props = {
  traceId: string;
};

export function RequestorTimeline(props: Props) {
  const { traceId } = props;
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
    <TimelineProvider>
      <ResizablePanelGroup
        direction="horizontal"
        id="requestor-timeline"
        className=""
      >
        {!isSmallScreen && (
          <>
            <ResizablePanel
              minSize={minSize}
              defaultSize={33}
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
        <ResizablePanel className="max-h-full" order={1} id="details">
          <Content className="overflow-auto h-fit">
            <TimelineListDetails waterfall={waterfall} />
          </Content>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TimelineProvider>
  );
}

const Content = (props: { className?: string; children: ReactNode }) => (
  <div className={cn("mt-2 px-3 py-2 min-h-[10rem]", props.className)}>
    {props.children}
  </div>
);
