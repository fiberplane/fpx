import NeonLogo from "@/assets/NeonLogo.svg";
import { CodeMirrorSqlEditor } from "@/components/CodeMirrorEditor";
import {
  getBgColorForLevel,
  getTextColorForLevel,
} from "@/components/Timeline/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks";
import type { MizuOrphanLog } from "@/queries";
import { cn, isJson, noop } from "@/utils";
import { CopyIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { format } from "sql-formatter";
import { type LogEntry, type NeonEvent, isNeonEvent } from "./types";

type LogRowProps = {
  log: LogEntry;
};

export function LogRow({ log }: LogRowProps) {
  if (isNeonEvent(log)) {
    return <NeonEventRow log={log} />;
  }
  return <LogRowEntry log={log} />;
}

function NeonEventRow({ log }: { log: NeonEvent }) {
  const bgColor = "bg-green-500/10";
  // const textColor = "text-gray-500";
  const [isExpanded, setIsExpanded] = useState(false);
  // we don't want the focus ring to be visible when the user is selecting the row with the mouse
  const [isMouseSelected, setIsMouseSelected] = useState(false);
  const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
    useCopyToClipboard();
  const {
    isCopied: isArgumentsCopied,
    copyToClipboard: copyArgumentsToClipboard,
  } = useCopyToClipboard();

  const message = "Neon DB Call";

  const queryValue = useMemo(() => {
    try {
      const paramsFromNeon = log.sql.params ?? [];
      // NOTE - sql-formatter expects the index in the array to match the `$nr` syntax from postgres
      //        this makes the 0th index unused, but it makes the rest of the indices match the `$1`, `$2`, etc.
      const params = ["", ...paramsFromNeon];
      return format(log.sql.query, {
        language: "postgresql",
        params,
      });
    } catch (e) {
      // Being very defensive soz
      return log?.sql?.query ?? "";
    }
  }, [log]);

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
        <div className={"w-2 h-2 mr-2 flex-shrink-0"}>
          <NeonLogo className="w-2 h-2" />
        </div>
        <div className="font-mono text-xs flex-grow truncate">{message}</div>
        <div className="font-mono text-xs text-right whitespace-nowrap ml-2">
          {formatTimestamp(log.timestamp)}
        </div>
      </summary>
      <div className="p-2 font-mono text-xs text-muted-foreground relative">
        <div className="pl-4">
          {/* <p>
            Level: <span className={textColor}>{log.level.toUpperCase()}</span>
          </p> */}
          <div className="flex gap-2">
            <p>Query:</p>
            <CodeMirrorSqlEditor
              value={queryValue}
              onChange={noop}
              readOnly={true}
            />
            <div className="-mt-2 flex justify-start">
              <TooltipProvider>
                <Tooltip open={isMessageCopied}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Copy log message"
                      onClick={() => copyMessageToClipboard(queryValue ?? "")}
                      className="flex items-center gap-1"
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Message copied</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function LogRowEntry({ log }: { log: MizuOrphanLog }) {
  const bgColor = getBgColorForLevel(log.level);
  const textColor = getTextColorForLevel(log.level);
  const [isExpanded, setIsExpanded] = useState(false);
  // we don't want the focus ring to be visible when the user is selecting the row with the mouse
  const [isMouseSelected, setIsMouseSelected] = useState(false);
  const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
    useCopyToClipboard();
  const {
    isCopied: isArgumentsCopied,
    copyToClipboard: copyArgumentsToClipboard,
  } = useCopyToClipboard();

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
              <div className="text-foreground break-words grow">
                {isJson(log.message) ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(log.message), null, 2)}
                  </pre>
                ) : (
                  <p>{log.message}</p>
                )}
              </div>
              <div className="-mt-2 flex justify-start">
                <TooltipProvider>
                  <Tooltip open={isMessageCopied}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copy log message"
                        onClick={() =>
                          copyMessageToClipboard(log.message ?? "")
                        }
                        className="flex items-center gap-1"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Message copied</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
          {log.args.length > 0 && (
            <div className="flex gap-2">
              <p>Additional arguments:</p>
              <div className="text-foreground break-words grow">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(log.args, null, 2)}
                </pre>
              </div>
              <div className="-mt-2 flex justify-start">
                <TooltipProvider>
                  <Tooltip open={isArgumentsCopied}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copy log message"
                        onClick={() =>
                          copyArgumentsToClipboard(
                            JSON.stringify(log.args, null, 2),
                          )
                        }
                        className="flex items-center gap-1"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Arguments copied</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
