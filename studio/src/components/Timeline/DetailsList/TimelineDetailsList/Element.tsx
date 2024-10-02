import { formatTimestamp } from "@/components/Log";
import { Button } from "@/components/ui/button";
// import ExpandIcon from "@/assets/Expand.svg";
import { SpanStatus } from "@/constants";
import { isMizuOrphanLog } from "@/queries";
import { type Waterfall, cn } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { type HTMLAttributes, useState } from "react";
import { DurationIndicator } from "../../graph/DurationIndicator";
import { EventIndicator } from "../../graph/EventIndicator";
import { getBgColorForLevel } from "../../utils";
import { Content } from "./Content";
import { TimelineDetailItemHeader } from "./Header";
import { ItemIcon } from "./ItemIcon";
import { getId, getLevelForSpan } from "./utils";

type Props = {
  item: Waterfall[0];
  timelineVisible: boolean;
  minStart: number;
  duration: number;
  indent?: number;
};

export function Element({
  item,
  timelineVisible: isMdScreen,
  minStart,
  duration,
  indent = 0,
}: Props) {
  const isLog = isMizuOrphanLog(item);
  const bgColor = getBgColorForLevel(
    isLog
      ? item.level
      : item.span.status?.code === SpanStatus.ERROR
        ? "error"
        : "info",
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const indentSpace = indent * 20;
  return (
    <div
      key={getId(item)}
      className={cn(
        "max-w-full",
        "first:rounded-t-sm transition-all",
        "last:border-none",
        "group",
        "data-[highlighted=true]:bg-primary/10",
        "border-b border-muted-foreground/30",
        "grid",
        bgColor,
        isMdScreen
          ? "grid-cols-[24px_auto_150px_min-content]"
          : "grid-cols-[24px_auto_min-content]",
      )}
    >
      <DivWithHover
        className="flex items-center justify-around h-6
       pr-3"
      >
        <ItemIcon item={item} />
      </DivWithHover>
      <div
        className={cn(
          "flex",
          // min width needed for ellipsis to work
          "min-w-0",
        )}
      >
        <div
          className={cn(
            "grow",
            // min width needed for ellipsis to work
            "min-w-0",
          )}
        >
          <DivWithHover
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ paddingLeft: `${indentSpace}px` }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setIsExpanded(!isExpanded);
              }
            }}
            tabIndex={0}
            role="button"
            className="group-hover:bg-primary/10  pr-3"
          >
            <TimelineDetailItemHeader item={item} />
          </DivWithHover>
          {isExpanded && (
            <div style={{ paddingLeft: `${indentSpace}px` }}>
              <Content item={item} />
            </div>
          )}
          {/* <Content
            item={item}
            traceDuration={0}
            traceStartTime={minStart}
            isExpanded={isExpanded}
            toggleExpand={() => setIsExpanded(!isExpanded)}
          /> */}
        </div>
        <DivWithHover className="h-6 flex items-center justify-center text-primary grow-0  pr-3">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon icon={isExpanded ? "ph:caret-up" : "ph:caret-down"} />
          </Button>
        </DivWithHover>
      </div>
      {isMdScreen && (
        <DivWithHover className="h-6  pr-3">
          {isMizuOrphanLog(item) ? (
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
          )}
        </DivWithHover>
      )}

      <DivWithHover className="text-xs font-mono  text-muted-foreground min-h-6 flex justify-end pl-3 h-6">
        <div>
          {formatTimestamp(
            isMizuOrphanLog(item) ? item.timestamp : item.span.start_time,
          )}
        </div>
      </DivWithHover>
    </div>
  );
}

const DivWithHover = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div {...props} className={cn("group-hover:bg-primary/10", className)}>
      {children}
    </div>
  );
};
