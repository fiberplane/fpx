import { formatTimestamp } from "@/components/LogContent";
// import ExpandIcon from "@/assets/Expand.svg";
import { SpanStatus } from "@/constants";
import { isMizuOrphanLog } from "@/queries";
import { type Waterfall, cn } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { DurationIndicator } from "../../graph/DurationIndicator";
import { EventIndicator } from "../../graph/EventIndicator";
import { getBgColorForLevel } from "../../utils";
import { Content } from "./Content";
import { ItemIcon } from "./ItemIcon";
import { getId, getLevelForSpan } from "./utils";

export function Element({
  item,
  timelineVisible: isMdScreen,
  minStart,
  duration,
  indent = 0,
}: {
  item: Waterfall[0];
  timelineVisible: boolean;
  minStart: number;
  duration: number;
  indent?: number;
}) {
  // const highlightedSpanId = null ;
  // console.log("indent", indent);
  const isLog = isMizuOrphanLog(item);
  const bgColor = getBgColorForLevel(
    isLog
      ? item.level
      : item.span.status?.code === SpanStatus.ERROR
        ? "error"
        : "info",
  );
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      key={getId(item)}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          setIsExpanded(!isExpanded);
        }
      }}
      tabIndex={0}
      role="button"
      // onMouseEnter={() => setHighlightedSpanId(getId(item))}
      // onMouseLeave={() => setHighlightedSpanId(null)}
      className={cn(
        "max-w-full",
        // "border-l-2 border-transparent ""
        "rounded-sm transition-all",
        "hover:bg-primary/10",
        "data-[highlighted=true]:bg-primary/10",
        "border-b border-muted-foreground/30",
        // "relative after:absolute after:bottom-[-4px] after:bg-muted-foreground/30 after:w-full after:h-px last:after:h-0",
        "grid gap-3",
        bgColor,
        // `ml-${indent * 2}`,
        // "grid gap-2 bg-muted/50",
        isMdScreen
          ? "grid-cols-[24px_auto_150px_min-content]"
          : "grid-cols-[24px_auto_min-content]",
      )}
    >
      <div className="flex items-center justify-around h-6">
        <ItemIcon item={item} />
      </div>
      <div
        style={{ marginLeft: `${(indent * 16) / 16}rem` }}
        className="flex gap-2 min-w-0"
      >
        <div className="grow min-w-0">
          <Content
            item={item}
            traceDuration={0}
            traceStartTime={minStart}
            isExpanded={isExpanded}
            toggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>
        <div className="h-6 flex items-center justify-center text-primary grow-0">
          <Icon icon={isExpanded ? "ph:caret-up" : "ph:caret-down"} />
        </div>
      </div>
      {isMdScreen &&
        (isMizuOrphanLog(item) ? (
          <EventIndicator
            timestamp={item.timestamp.getTime()}
            traceDuration={duration}
            traceStartTime={minStart}
          />
        ) : (
          <DurationIndicator
            isActive={indent === 0}
            itemStartTime={item.span.start_time.getTime()}
            itemDuration={
              item.span.end_time.getTime() - item.span.start_time.getTime()
            }
            level={getLevelForSpan(item)}
            traceDuration={duration}
            traceStartTime={minStart}
          />
        ))}

      <div className="text-xs font-mono  text-muted-foreground h-6 flex items-center">
        <div>
          {formatTimestamp(
            isMizuOrphanLog(item) ? item.timestamp : item.span.start_time,
          )}
        </div>
      </div>
    </div>
  );
}
