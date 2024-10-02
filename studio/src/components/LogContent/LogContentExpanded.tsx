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
import { getTextColorForLevel } from "../Timeline/utils";

type Props = Pick<
  MizuOrphanLog,
  "level" | "service" | "message" | "args" | "callerLocations"
>;
export function LogContentExpanded(log: Props) {
  const textColor = getTextColorForLevel(log.level);
  const parsedMessage = log.message && safeParseJson(log.message);
  const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
    useCopyToClipboard();

  const {
    isCopied: isArgumentsCopied,
    copyToClipboard: copyArgumentsToClipboard,
  } = useCopyToClipboard();

  return (
    <div
      className="p-2 font-mono text-xs text-muted-foreground relative"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.stopPropagation();
        }
      }}
    >
      <div className="pl-4">
        {/* The element below is to convince tailwind to include all dynamic color styles */}
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
          Level: <span className={textColor}>{log.level.toUpperCase()}</span>
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
                      onClick={() => copyMessageToClipboard(log.message ?? "")}
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
                        href={`vscode://${fileLocation.replace("file:///", "file/")}`}
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
  );
}
