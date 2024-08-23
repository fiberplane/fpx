import { isMizuOrphanLog } from "@/queries";
import { Waterfall } from "@/utils";
import { WaterfallRowLog } from "./WaterfallRowLog";
import { WaterfallRowSpan } from "./WaterfallRowSpan";

type Props = {
  waterfall: Waterfall;
  duration: number;
  minStart: number;
  activeId: string | null;
};

export function Timeline(props: Props) {
  const { waterfall, duration, minStart, activeId } = props;

  return (
    <div className="flex flex-col">
      {waterfall.map((spanOrLog) => {
        if (isMizuOrphanLog(spanOrLog)) {
          return (
            <WaterfallRowLog
              key={spanOrLog.id}
              log={spanOrLog}
              duration={duration}
              startTime={minStart}
              isActive={activeId === `${spanOrLog.id}`}
            />
          );
        }
        return (
          <WaterfallRowSpan
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
