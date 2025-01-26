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
  showDuration?: boolean;
}) {
  const {
    itemDuration,
    itemStartTime,
    traceDuration,
    traceStartTime,
    isActive,
    level = "info",
    showDuration = false,
  } = props;
  const normalizedDuration = itemDuration / traceDuration;
  const percentageWidth =
    traceDuration === 0 ? 100 : (normalizedDuration * 100).toFixed(6);
  const lineWidth = `${percentageWidth}%`;

  const lineOffsetNumeric =
    traceDuration === 0
      ? 0
      : ((itemStartTime - traceStartTime) / traceDuration) * 100;
  const lineOffset = `${lineOffsetNumeric.toFixed(4)}%`;

  const [visible, setVisible] = React.useState(false);
  return (
    <DurationContainer className="pl-1.5 pr-1.5 pt-[1px]">
      <Tooltip open={visible}>
        <div
          className={cn(
            "data-[highlighted=true]:bg-primary/10",
            "transition-all ",
            "relative min-w-0",
            "max-w-full",
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
                "border",
                levelToBorderColor(level, isActive ?? false),
                levelToBgColor(level, isActive ?? false),
                "h-3.5 flex items-center min-w-0 rounded",
                "max-w-full",
                "text-center",
              )}
              style={{ width: lineWidth, marginLeft: lineOffset }}
            >
              {showDuration ? (
                <div className="text-xs text-foreground/70 text-center mx-auto scale-75">
                  {itemDuration}ms
                </div>
              ) : null}
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

const levelToBorderColor = (
  level: "info" | "warn" | "error",
  isActive: boolean,
) => {
  switch (level) {
    case "info":
      return isActive ? "border-primary" : "border-primary/70";
    case "warn":
      return isActive ? "border-warning" : "border-warning/70";
    case "error":
      return isActive ? "border-danger" : "border-danger/70";
  }
};

const levelToBgColor = (
  level: "info" | "warn" | "error",
  isActive: boolean,
) => {
  switch (level) {
    case "info":
      return isActive ? "bg-primary/30" : "bg-primary/10";
    case "warn":
      return isActive ? "bg-warning/30" : "bg-warning/10";
    case "error":
      return isActive ? "bg-danger/30" : "bg-danger/10";
  }
};
