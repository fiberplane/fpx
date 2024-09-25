import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";

import * as React from "react";

export function DurationIndicator(props: {
  itemStartTime: number;
  itemDuration: number;
  traceDuration: number;
  traceStartTime: number;
}) {
  const { itemDuration, itemStartTime, traceDuration, traceStartTime } = props;
  const normalizedDuration = itemDuration / traceDuration;
  const percentageWidth =
    traceDuration === 0 ? 100 : (normalizedDuration * 100).toFixed(6);
  const lineWidth = `calc(${4 * 0.0625}rem + ${percentageWidth}%)`;
  const lineOffsetNumeric =
    traceDuration === 0
      ? 0
      : ((itemStartTime - traceStartTime) / traceDuration) * 100;
  const lineOffset = `calc(${lineOffsetNumeric.toFixed(4)}% - ${2 * 0.0625}rem)`;
  console.log({ itemDuration, traceDuration });
  const [visible, setVisible] = React.useState(false);
  return (
    <Tooltip open={visible}>
      <div
        className={cn(
          // "flex items-center p-2",
          "mx-0 relative left-0",
          "border-l-2 border-transparent rounded-sm",
          "hover:bg-primary/10 hover:border-blue-800 hover:rounded-l-none",
          // isActive && "bg-primary/10 border-blue-500",
          "data-[highlighted=true]:bg-primary/10",
          "transition-all ",
        )}
      >
        <TooltipTrigger
          asChild
          onPointerEnter={() => setVisible(true)}
          onPointerCancel={() => setVisible(false)}
          onPointerLeave={() => setVisible(false)}
        >
          <div
            className={cn(
              "h-2.5 border-l-2 border-r-2 border-blue-800 flex items-center min-w-0 absolute",
            )}
            style={{ width: lineWidth, marginLeft: lineOffset }}
          >
            <div className={"h-0.5 min-w-0.5 bg-blue-800 w-full"} />
          </div>
        </TooltipTrigger>
      </div>
      <TooltipContent
        side="top"
        className="rounded-xl border bg-background z-10 text-card-foreground/75"
      >
        duration: {itemDuration}ms
      </TooltipContent>
    </Tooltip>
  );
}
