import { Timeline, extractWaterfallTimeStats } from "@/components/Timeline";
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
    minPixelSize: 300,
  });

  return (
    <ResizablePanelGroup direction="horizontal" id="requestor-timeline">
      <ResizablePanel minSize={minSize}>
        <Content>
          <Timeline
            waterfall={waterfall}
            minStart={minStart}
            duration={duration}
            activeId=""
          />
        </Content>
      </ResizablePanel>
      <ResizableHandle hitAreaMargins={{ coarse: 20, fine: 10 }} />
      <ResizablePanel>
        <Content>Other content</Content>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

const Content = (props: { className?: string; children: ReactNode }) => (
  <div className={cn("mt-2 px-3 py-2", props.className)}>{props.children}</div>
);
