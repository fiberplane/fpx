import type { MizuOrphanLog } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import { useTimelineContext } from "../context";
import { useTimelineTitle } from "../hooks";
import { getBgColorForLevel, getTextColorForLevel } from "../utils";

export const TimelineGraphLog: React.FC<{
  log: MizuOrphanLog;
  duration: number;
  startTime: number;
  isActive: boolean;
}> = ({ log, duration, startTime, isActive }) => {
  const left =
    ((new Date(log.timestamp).getTime() - startTime) / duration) * 100;
  const lineOffset = `calc(${left.toFixed(4)}% - ${3 * 0.0625}rem)`;
  const colorTextLevel = getTextColorForLevel(log.level);
  const colorBgLevel = getBgColorForLevel(log.level);
  const title = useTimelineTitle(log);
  const { setHighlightedSpanId, highlightedSpanId } = useTimelineContext();

  return (
    <a
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent rounded-sm",
        "hover:bg-primary/10 hover:border-blue-500 hover:rounded-l-none",
        isActive && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
        "data-[highlighted=true]:bg-primary/10",
        colorBgLevel,
      )}
      data-highlighted={highlightedSpanId === `${log.id}`}
      href={`#${log.id}`}
      onMouseEnter={() => setHighlightedSpanId(`${log.id}`)}
      onMouseLeave={
        setHighlightedSpanId
          ? () => setHighlightedSpanId(`${log.id}`)
          : undefined
      }
    >
      <div className={cn("mr-2")}>
        <Icon
          icon="lucide:terminal"
          className={cn(colorTextLevel)}
          width={16}
          height={16}
        />
      </div>
      <div className="flex flex-col w-20 overflow-hidden">
        <div className="font-mono font-normal text-xs truncate text-gray-200">
          {title}
        </div>
      </div>
      <div className="text-gray-400 flex flex-grow items-center mx-4">
        <div
          className="h-2.5 items-center min-w-1"
          style={{ marginLeft: lineOffset }}
          title={log.timestamp.toString()}
        >
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
        </div>
      </div>
    </a>
  );
};
