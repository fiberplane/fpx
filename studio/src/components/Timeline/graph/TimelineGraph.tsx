import { isMizuOrphanLog } from "@/queries";
import type { Waterfall } from "@/utils";
import { TimelineGraphLog } from "./TimelineGraphLog";
import { TimelineGraphSpan } from "./TimelineGraphSpan";

type Props = {
  waterfall: Waterfall;
  duration: number;
  minStart: number;
  activeId: string | null;
  className?: string;
};

export function TimelineGraph(props: Props) {
  const { waterfall, duration, minStart, activeId } = props;

  return (
    <div className="flex flex-col">
      {waterfall.map((spanOrLog) => {
        if (isMizuOrphanLog(spanOrLog)) {
          return (
            <TimelineGraphLog
              key={spanOrLog.id}
              log={spanOrLog}
              duration={duration}
              startTime={minStart}
              isActive={activeId === `${spanOrLog.id}`}
            />
          );
        }

        return (
          <TimelineGraphSpan
            key={spanOrLog.span.span_id}
            span={spanOrLog.span}
            vendorInfo={spanOrLog.vendorInfo}
            duration={duration}
            startTime={minStart}
            isActive={activeId === `${spanOrLog.span.span_id}`}
          />
        );
      })}
    </div>
  );
}
