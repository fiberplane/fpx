import NeonLogo from "@/assets/NeonLogo.svg";
import { CodeMirrorSqlEditor } from "@/components/CodeMirrorEditor";
import { useFormattedNeonQuery } from "@/components/Timeline";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks";
import { cn, getString, noop } from "@/utils";
import { CopyIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import type { NeonEvent } from "../types";
import { formatTimestamp } from "./shared";

export function NeonEventRow({ log }: { log: NeonEvent }) {
  const bgColor = "bg-green-500/10";
  // const textColor = "text-gray-500";
  const [isExpanded, setIsExpanded] = useState(false);
  // we don't want the focus ring to be visible when the user is selecting the row with the mouse
  const [isMouseSelected, setIsMouseSelected] = useState(false);
  const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
    useCopyToClipboard();

  const isError = !!log.errors?.length;

  const message = isError
    ? "Neon DB Call failed"
    : `Neon DB Call took ${log.duration}ms`;

  const queryValue = useFormattedNeonQuery(log.sql);
  // This will show `SELECT`, `INSERT`, etc. instead of the full query
  const queryTypePreview = useMemo(() => {
    const queryType = (queryValue.split("\n")?.[0] ?? "").toUpperCase();
    return queryType.length < queryValue.length ? `${queryType}...` : queryType;
  }, [queryValue]);

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
        <div className={cn("w-2 h-2 mr-2 flex-shrink-0")}>
          <NeonLogo className="w-2 h-2" />
        </div>
        <div className="font-mono text-xs flex-grow truncate">
          <span className={cn({ "text-red-400": isError })}>{message}</span>{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {queryTypePreview}
          </span>
        </div>
        <div className="font-mono text-xs text-right whitespace-nowrap ml-2">
          {formatTimestamp(log.timestamp)}
        </div>
      </summary>
      <div className="p-2 font-mono text-xs text-muted-foreground relative">
        <div className="pl-4">
          <div className="flex gap-2">
            <p>Duration:</p>
            <div className="flex justify-start">
              <p>{log.duration}ms</p>
            </div>
          </div>

          {isError && (
            <div className="flex gap-2">
              <p>Error:</p>
              <div className="flex justify-start">
                <p>
                  {getString(
                    log.errors?.[0]?.attributes?.["exception.message"],
                  )}
                </p>
              </div>
            </div>
          )}

          {!isError && (
            <div className="flex gap-2">
              <p>Row Count:</p>
              <div className="flex justify-start">
                <p>{log.rowCount}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <p>Query:</p>
            <CodeMirrorSqlEditor
              lineNumbers={false}
              value={queryValue}
              onChange={noop}
              readOnly={true}
            />
            <div className="flex justify-start">
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
