import { LogContent, LogHeader } from "@/components/Log";
import { getBgColorForLevel } from "@/components/Timeline/utils";
import type { MizuOrphanLog } from "@/queries";
import { cn } from "@/utils";
import { useState } from "react";

type LogRowProps = {
  log: MizuOrphanLog;
  showTimestamp?: boolean;
};

export function LogRow({ log }: LogRowProps) {
  const bgColor = getBgColorForLevel(log.level);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(bgColor, "hover:bg-muted")}>
      <div className={cn(isExpanded ? "rounded-t-xl" : "rounded-xl")}>
        <button
          tabIndex={0}
          type="button"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
          onClick={(event) => {
            event?.preventDefault();
            event.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            "cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset w-full text-left",
            isExpanded ? "rounded-t-lg" : "rounded-lg",
          )}
        >
          <LogHeader
            logLevel={log.level}
            message={log.message}
            timestamp={log.timestamp}
          />
        </button>
        {isExpanded && (
          <div>
            <LogContent
              className="pl-4"
              level={log.level}
              service={log.service}
              message={log.message}
              args={log.args}
              callerLocations={log.callerLocations}
            />
          </div>
        )}
      </div>
    </div>
  );
}
