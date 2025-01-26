import { formatTimestamp } from "@/components/Log";
import { Button } from "@/components/ui/button";
import { SpanStatus } from "@/constants";
import { isMizuOrphanLog } from "@/types";
import { type Waterfall, cn, isIncomingRequestSpan } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import { type HTMLAttributes, useState } from "react";
import { DurationIndicator, EventIndicator } from "../../graph";
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
  // NOTE - Changed this from studio for the demo, since I thought it was a bug that child spans like D1 did not show their duration
  const shouldShowDuration = !isLog; // && isIncomingRequestSpan(item.span);
  const bgColor = getBgColorForLevel(
    isLog
      ? item.level
      : item.span.status?.code === SpanStatus.ERROR
        ? "error"
        : "info",
  );
  const [isExpanded, setIsExpanded] = useState(() => {
    if (isMizuOrphanLog(item)) {
      return item.level === "error";
    }

    return item.span.status?.code === SpanStatus.ERROR;
  });
  const onClickToggle = useHandler(() => setIsExpanded(!isExpanded));
  const onKeyDownToggle = useHandler((event) => {
    if (event.key === "Enter") {
      setIsExpanded(!isExpanded);
    }
  });

  const indentSpace = indent * 20;
  return (
    <div
      key={getId(item)}
      className={cn(
        "max-w-full",
        "min-w-0",
        "first:rounded-t-sm transition-all",
        "group",
        "border-b border-muted-foreground/30 last:border-none",
        bgColor,
      )}
    >
      <div
        className={cn(
          "grid",
          "py-1",
          isMdScreen
            ? "grid-cols-[2rem_auto_150px_min-content]"
            : "grid-cols-[2rem_auto_min-content]",
        )}
      >
        <DivWithHover
          onClick={onClickToggle}
          onKeyDown={onKeyDownToggle}
          className="flex items-center justify-around h-7
       pr-3 pl-1"
        >
          <ItemIcon item={item} />
        </DivWithHover>
        <div
          className={cn(
            "grid",
            "grid-cols-[1fr_2rem]",
            // "items-center",
            // min width needed for ellipsis to work
            "min-w-0",
          )}
        >
          <div
            className={cn(
              // min width needed for ellipsis to work
              "min-w-0",
            )}
          >
            <button
              type="button"
              onClick={onClickToggle}
              onKeyDown={onKeyDownToggle}
              style={{ paddingLeft: `${indentSpace}px` }}
              className={cn(
                "group-hover:bg-primary/10 pr-3 w-full text-left",
                // HACK - Other grid cols have h-6
                "min-h-7",
              )}
            >
              <TimelineDetailItemHeader item={item} />
            </button>
          </div>
          <DivWithHover
            className="h-7 flex items-center justify-center text-primary grow-0 pr-3"
            onClick={onClickToggle}
            onKeyDown={onKeyDownToggle}
          >
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
          <DivWithHover
            className="h-7 pr-3"
            onClick={onClickToggle}
            onKeyDown={onKeyDownToggle}
          >
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
                showDuration={shouldShowDuration}
              />
            )}
          </DivWithHover>
        )}

        <DivWithHover
          onClick={onClickToggle}
          onKeyDown={onKeyDownToggle}
          className={cn(
            "text-xs font-mono text-muted-foreground",
            "min-h-7 h-7",
            "flex justify-end pl-3 items-center",
            "text-nowrap",
          )}
        >
          <div>
            {formatTimestamp(
              isMizuOrphanLog(item) ? item.timestamp : item.span.start_time,
            )}
          </div>
        </DivWithHover>
      </div>
      {isExpanded && (
        <div className={cn("overflow-auto min-w-0", "max-w-full")}>
          <div
            style={{ paddingLeft: `${indentSpace + 32}px` }}
            className={cn("")}
          >
            <Content item={item} />
          </div>
        </div>
      )}
    </div>
  );
}

const DivWithHover = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className={cn("group-hover:bg-primary/10 cursor-pointer", className)}
    >
      {children}
    </div>
  );
};
