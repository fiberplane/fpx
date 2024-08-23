import { useOtelTrace } from "@/queries";
import { useOrphanLogs } from "../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { extractWaterfallTimeStats, Timeline } from "@/components/Timeline";
import { useAsWaterfall } from "@/components/Timeline/hooks/useAsWaterfall";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type Props = {
  traceId: string;
};

export function RequestorTimeline(props: Props) {
  const { traceId } = props;
  const { data: spans } = useOtelTrace(traceId);
  // const isNotFound = !spans && !error && !isLoading;

  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useAsWaterfall(spans ?? [], orphanLogs);
  const { minStart, duration } = extractWaterfallTimeStats(waterfall);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>
        <Timeline
          waterfall={waterfall}
          minStart={minStart}
          duration={duration}
          activeId=""
        />
      </ResizablePanel>
      <ResizableHandle hitAreaMargins={{ coarse: 20, fine: 10 }} />
      <ResizablePanel>Skillzz</ResizablePanel>
    </ResizablePanelGroup>
  );
}
