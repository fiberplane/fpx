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
  // const lineWidth = `calc(${-4 * 0.0625}rem + ${percentageWidth}%)`;
  const lineWidth = `calc(${2 * 0.0625}rem + ${percentageWidth}%)`;

  const lineOffsetNumeric =
    traceDuration === 0
      ? 0
      : ((itemStartTime - traceStartTime) / traceDuration) * 100;
  // const lineOffset = `calc(${lineOffsetNumeric.toFixed(4)}% + ${2 * 0.0625}rem)`;
  const lineOffset = `calc(${lineOffsetNumeric.toFixed(4)}% - ${0 * 0.0625}rem)`;

  const [visible, setVisible] = React.useState(false);
  return (
    <div className="pl-1 pr-1.5 bg-muted/40 rounded hover hover:bg-primary/20">
      <Tooltip open={visible}>
        <div
          className={cn(
            // "mx-0 relative left-0",

            // isActive && "bg-primary/10 border-blue-500",
            "data-[highlighted=true]:bg-primary/10",
            "transition-all ",
            "relative min-w-0",
            "pt-1",
          )}
        >
          <TooltipTrigger
            asChild
            onPointerEnter={() => setVisible(true)}
            onPointerCancel={() => setVisible(false)}
            onPointerLeave={() => setVisible(false)}
          >
            <div>
              <div
                className={cn(
                  "h-4 border border-blue-700 bg-blue-950 flex items-center min-w-0 absolute rounded",
                )}
                style={{ width: lineWidth, marginLeft: lineOffset }}
              >
                {/* <div className={"h-0.5 min-w-0.5 bg-blue-700 w-full"} /> */}
              </div>
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
    </div>
  );
}
