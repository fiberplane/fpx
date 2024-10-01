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
    <DurationContainer className="pl-1 pr-2">
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
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
        </div>
      </div>
    </DurationContainer>
  );
}
