import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";

import * as React from "react";
import { DurationContainer } from "./DurationContainer";

export function DurationIndicator(props: {
  itemStartTime: number;
  itemDuration: number;
  traceDuration: number;
  traceStartTime: number;
  isActive?: boolean;
  level?: "info" | "warn" | "error";
}) {
  const {
    itemDuration,
    itemStartTime,
    traceDuration,
    traceStartTime,
    isActive,
    level = "info",
  } = props;
  const normalizedDuration = itemDuration / traceDuration;
  const percentageWidth =
    traceDuration === 0 ? 100 : (normalizedDuration * 100).toFixed(6);
  const lineWidth = `${percentageWidth}%`;

  const lineOffsetNumeric =
    traceDuration === 0
      ? 0
      : ((itemStartTime - traceStartTime) / traceDuration) * 100;
  // const lineOffset = `calc(${lineOffsetNumeric.toFixed(4)}% + ${2 * 0.0625}rem)`;
  // const lineOffset = `calc(${lineOffsetNumeric.toFixed(4)}% - ${0 * 0.0625}rem)`;
  const lineOffset = `${lineOffsetNumeric.toFixed(4)}%`;

  const [visible, setVisible] = React.useState(false);
  return (
    <DurationContainer className="pl-1.5 pr-1.5">
      <Tooltip open={visible}>
        <div
          className={cn(
            // "mx-0 relative left-0",

            // isActive && "bg-primary/10 border-blue-500",
            "data-[highlighted=true]:bg-primary/10",
            "transition-all ",
            "relative min-w-0",
            "max-w-full",
            // "pt-0.5",
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
                  // `h-4 border border-${levelToColor(level)}-700 bg-${levelToColor(level)}-950 flex items-center min-w-0 absolute rounded`,
                  `h-4 border border-${levelToColor(level)}-${isActive ? 600 : 700} bg-${levelToColor(level)}-${isActive && level !== "info" ? 950 : 950} flex items-center min-w-0 absolute rounded`,
                  // (isActive || level !== "info") && `bg-${levelToColor(level)}-900 border-${levelToColor(level)}-500`,
                  "max-w-full",
                  // "bg-red-900"
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
    </DurationContainer>
  );
}

export const levelToColor = (level: "info" | "warn" | "error") => {
  switch (level) {
    case "info":
      return "blue";
    case "warn":
      return "yellow";
    case "error":
      return "red";
  }
};
