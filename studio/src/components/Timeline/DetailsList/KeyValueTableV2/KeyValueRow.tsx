import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { type ReactNode, useState } from "react";

export const KeyValueRow = ({
  entry,
  sensitiveKeys = [],
  keyCellClassName,
}: {
  entry: [string | ReactNode, string | ReactNode];
  sensitiveKeys?: string[] | ((key: string) => boolean);
  keyCellClassName?: string;
}) => {
  const [key, value] = entry;

  let isSensitive = false;
  if (typeof key === "string") {
    if (typeof sensitiveKeys === "function") {
      isSensitive = sensitiveKeys(key);
    } else if (Array.isArray(sensitiveKeys)) {
      isSensitive = sensitiveKeys.includes(key);
    }
  }
  const [showSensitive, setShowSensitive] = useState(false);

  return (
    <TableRow>
      <TableCell
        className={cn(
          "px-0 font-medium min-w-[140px] w-[140px] lg:min-w-[200px] uppercase text-xs text-muted-foreground",
          keyCellClassName,
        )}
      >
        {key}
      </TableCell>
      <TableCell className="font-mono align-middle h-full">
        <div className="flex items-center w-full">
          {isSensitive && (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="mr-3 flex-shrink-0 w-4 h-4"
                >
                  {showSensitive ? (
                    <EyeClosedIcon className="w-3 h-3" />
                  ) : (
                    <EyeOpenIcon className="w-3 h-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {showSensitive
                  ? "Hide Sensitive Value"
                  : "Show Sensitive Value"}
              </TooltipContent>
            </Tooltip>
          )}
          <span
            className={cn(
              "flex-grow",
              isSensitive && !showSensitive
                ? "italic text-muted-foreground"
                : "",
            )}
          >
            {isSensitive && !showSensitive ? "hidden" : value}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
};
