import {
  // getBgColorForLevel,
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
import { cn, safeParseJson } from "@/utils";
import { CopyIcon } from "@radix-ui/react-icons";

type LogRowProps = {
  log: MizuOrphanLog;
  showIcon?: boolean;
  showTimestamp?: boolean;
  isExpanded?: boolean;
  toggleExpand: () => void;
};

export function LogContent({
  log,
  showTimestamp = true,
  showIcon = true,
  isExpanded = false,
  toggleExpand,
}: LogRowProps) {
  // const bgColor = getBgColorForLevel(log.level);
  const textColor = getTextColorForLevel(log.level);
  // const [isExpanded, setIsExpanded] = useState(false);
  // we don't want the focus ring to be visible when the user is selecting the row with the mouse
  // const [isMouseSelected, setIsMouseSelected] = useState(false);
  const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
    useCopyToClipboard();
  const {
    isCopied: isArgumentsCopied,
    copyToClipboard: copyArgumentsToClipboard,
  } = useCopyToClipboard();

  const parsedMessage = log.message && safeParseJson(log.message);
  return (
    <div
      className={cn(isExpanded ? "rounded-t-xl" : "rounded-xl")}
      // onMouseDown={() => setIsMouseSelected(true)}
      // onBlur={() => setIsMouseSelected(false)}
    >
      <div
        tabIndex={0}
        role="button"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.stopPropagation();
            toggleExpand();
          }
        }}
        onClick={(event) => {
          event?.preventDefault();
          event.stopPropagation();
          toggleExpand();
        }}
        className={cn(
          "cursor-pointer py-1 flex items-center",
          // !isMouseSelected &&
          "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset",
          isExpanded ? "rounded-t-xl" : "rounded-xl",
        )}
      >
        {showIcon && (
          <div
            className={`w-2 h-2 mr-2 flex-shrink-0 rounded-[15%] ${getIconColor(log.level)}`}
          />
        )}

        <div className="font-mono text-xs flex-grow truncate">
          {typeof parsedMessage === "string" ? parsedMessage : log.message}
        </div>
        {showTimestamp && (
          <div className="font-mono text-xs text-right whitespace-nowrap ml-2">
            {formatTimestamp(log.timestamp)}
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="p-2 font-mono text-xs text-muted-foreground relative">
          <div className="pl-4">
            <div
              className={cn(
                "bg-blue-950",
                "bg-red-950",
                "border-blue-600",
                "border-red-600",
                "border-blue-700",
                "border-red-700",
              )}
            />
            <p>
              Level:{" "}
              <span className={textColor}>{log.level.toUpperCase()}</span>
            </p>
            {log.service && <p>Service: {log.service}</p>}
            {log.message && (
              <div className="flex gap-2">
                <p>Message:</p>
                <div className="text-foreground break-words grow">
                  {parsedMessage ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(parsedMessage, null, 2)}
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
                <div className="flex justify-start">
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
            {log.callerLocations && log.callerLocations.length > 0 && (
              <div>
                <p>Error: {parsedMessage}</p>
                <ul className="ml-3 mb-1">
                  {log.callerLocations.map((location, index) => {
                    const fileLocation = location.file
                      ? `${location.file}${location.line != null && `:${location.line}`}${location.column != null && `:${location.column}`}`
                      : "";
                    return (
                      <li key={index} className="pl-1">
                        at{" "}
                        <span className="text-accent-foreground">
                          {location.methodName}
                        </span>{" "}
                        {location.file?.startsWith("file://") ? (
                          <a
                            href={`vscode:${fileLocation}`}
                            className="text-blue-500 hover:underline"
                          >
                            {fileLocation}
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function getIconColor(level: MizuOrphanLog["level"]) {
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

export function formatTimestamp(timestamp: Date) {
  return timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
