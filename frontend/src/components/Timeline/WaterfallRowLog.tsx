import { MizuOrphanLog } from "@/queries";
import { useTimelineIcon, useTimelineTitle } from "./hooks";
import { getColorForLevel } from "./utils";
import { cn } from "@/utils";

export const WaterfallRowLog: React.FC<{
  log: MizuOrphanLog;
  duration: number;
  startTime: number;
  isActive: boolean;
}> = ({ log, duration, startTime, isActive }) => {
  const left =
    ((new Date(log.timestamp).getTime() - startTime) / duration) * 100;
  const lineOffset = `calc(${left.toFixed(4)}% - ${3 * 0.0625}rem)`;
  const icon = useTimelineIcon(log, {
    colorOverride: getColorForLevel(log.level),
  });
  const title = useTimelineTitle(log);

  return (
    <a
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent",
        "hover:bg-primary/10 hover:border-blue-500",
        isActive && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${log.id}`}
    >
      <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
      <div className="flex flex-col w-20 overflow-hidden">
        <div className="font-mono font-normal text-xs truncate text-gray-200">
          {title}
        </div>
      </div>
      <div className="text-gray-400 flex flex-grow items-center mx-4">
        <div
          className="h-2.5 items-center min-w-1"
          style={{ marginLeft: lineOffset }}
          title={log.timestamp}
        >
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
        </div>
      </div>
      <div className="ml-auto text-gray-400 text-xs w-12 px-2" />
    </a>
  );
};
