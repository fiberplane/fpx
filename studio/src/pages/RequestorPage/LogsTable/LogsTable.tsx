import React, { useState } from "react";
import {
  getBgColorForLevel,
  getTextColorForLevel,
} from "@/components/Timeline/utils";
import { Button } from "@/components/ui/button";
import type { MizuOrphanLog } from "@/queries";
import { useOtelTrace } from "@/queries";
import { cn, safeParseJson } from "@/utils";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Tabs } from "@radix-ui/react-tabs";
import { useOrphanLogs } from "../../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import { useRequestorStore } from "../store";
import { LogsEmptyState } from "./Empty";

type Props = {
  traceId?: string;
};

export function LogsTable({ traceId = "" }: Props) {
  const { data: spans } = useOtelTrace(traceId);
  const { togglePanel } = useRequestorStore("togglePanel");
  const logs = useOrphanLogs(traceId, spans ?? []);

  return (
    <Tabs defaultValue="logs" className="h-full">
      <CustomTabsList>
        <CustomTabTrigger value="logs">Logs ({logs.length})</CustomTabTrigger>
        <div className="flex-grow flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePanel("logsPanel")}
            className="h-6 w-6"
          >
            <Cross1Icon className="h-3 w-3 cursor-pointer" />
          </Button>
        </div>
      </CustomTabsList>
      <CustomTabsContent value="logs" className="overflow-hidden">
        <LogsGrid logs={logs} />
      </CustomTabsContent>
    </Tabs>
  );
}

type LogsGridProps = {
  logs: MizuOrphanLog[];
};

function LogsGrid({ logs }: LogsGridProps) {
  if (logs.length === 0) {
    return <LogsEmptyState />;
  }

  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
    </div>
  );
}

type LogRowProps = {
  log: MizuOrphanLog;
};

function LogRow({ log }: LogRowProps) {
  const bgColor = getBgColorForLevel(log.level);
  const textColor = getTextColorForLevel(log.level);
  const [isExpanded, setIsExpanded] = useState(false);
  // we don't want the focus ring to be visible when the user is selecting the row with the mouse
  const [isMouseSelected, setIsMouseSelected] = useState(false);

  return (
    <details
      className={cn(isExpanded ? "rounded-t-xl" : "rounded-xl", bgColor)}
      onToggle={(e) => setIsExpanded(e.currentTarget.open)}
      onMouseDown={() => setIsMouseSelected(true)}
      onBlur={() => setIsMouseSelected(false)}
    >
      <summary
        className={cn(
          "cursor-pointer px-2 py-1 flex items-center",
          "hover:bg-muted",
          !isMouseSelected &&
            "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset",
          isExpanded ? "rounded-t-xl" : "rounded-xl",
        )}
      >
        <div
          className={`w-2 h-2 mr-2 flex-shrink-0 rounded-[15%] ${getIconColor(log.level)}`}
        />
        <div className="font-mono text-xs flex-grow truncate">
          {log.message}
        </div>
        <div className="font-mono text-xs text-right whitespace-nowrap ml-2">
          {formatTimestamp(log.timestamp)}
        </div>
      </summary>
      <div className="p-2 font-mono text-xs text-muted-foreground relative">
        {/*
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-500" />
        */}
        <div className="pl-4">
          <p>
            Level: <span className={textColor}>{log.level.toUpperCase()}</span>
          </p>
          {log.service && <p>Service: {log.service}</p>}
          {log.callerLocation && (
            <p>
              Location: {log.callerLocation.file}:{log.callerLocation.line}:
              {log.callerLocation.column}
            </p>
          )}
          {log.message && (
            <div className="flex gap-2">
              <p>Message:</p>
              <p className="text-foreground break-words">
                {safeParseJson(log.message) ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(log.message), null, 2)}
                  </pre>
                ) : (
                  log.message
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function getIconColor(level: MizuOrphanLog["level"]) {
  switch (level) {
    case "error":
      return "bg-red-500";
    case "warn":
      return "bg-yellow-500";
    case "info":
      return "bg-blue-500";
    case "debug":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

function formatTimestamp(timestamp: Date) {
  return timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
