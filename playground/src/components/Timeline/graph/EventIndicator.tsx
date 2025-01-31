import { cn } from "@/utils";
import { DurationContainer } from "./DurationContainer";

type Props = {
  timestamp: number;
  traceDuration: number;
  traceStartTime: number;
};

export function EventIndicator(props: Props) {
  const { timestamp, traceDuration, traceStartTime } = props;
  const left =
    ((new Date(timestamp).getTime() - traceStartTime) / traceDuration) * 100;
  const lineOffset = `calc(${left.toFixed(4)}% - ${0 * 0.0625}rem)`;

  return (
    <DurationContainer className="pl-[5px] pr-2">
      <div
        className={cn(
          "data-[highlighted=true]:bg-primary/10",
          "transition-all ",
          "relative min-w-0",
        )}
      >
        <div
          className="h-4 flex items-center min-w-1"
          style={{ marginLeft: lineOffset }}
          title={new Date(timestamp).toISOString()}
        >
          <div className="h-1.5 w-1.5 min-w-1.5 border border-primary/70 bg-primary/30 rounded-full" />
        </div>
      </div>
    </DurationContainer>
  );
}
