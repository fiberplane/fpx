import { CountBadge } from "@/components/CountBadge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import { type ReactNode, useState } from "react";
import { SubSectionHeading } from "./shared";

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

export function KeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
  sensitiveKeys = [],
  keyCellClassName,
}: {
  keyValue:
    | Record<string, string>
    | Array<[string | ReactNode, string | ReactNode]>;
  emptyMessage?: string;
  className?: string;
  sensitiveKeys?: string[] | ((key: string) => boolean);
  keyCellClassName?: string;
}) {
  const isEmpty = Array.isArray(keyValue)
    ? keyValue.length === 0
    : Object.keys(keyValue).length === 0;
  const entries = Array.isArray(keyValue) ? keyValue : Object.entries(keyValue);
  return (
    <div className={cn(className)}>
      <Table className="border-0">
        <TableBody>
          {!isEmpty ? (
            entries.map((entry, index) => (
              <KeyValueRow
                key={typeof entry[0] === "string" ? entry[0] : index}
                entry={entry}
                sensitiveKeys={sensitiveKeys}
                keyCellClassName={keyCellClassName}
              />
            ))
          ) : (
            <TableRow>
              <TableCell className="text-muted-foreground italic" colSpan={2}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function CollapsibleKeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
  defaultCollapsed = true,
  title,
  sensitiveKeys = [],
  keyCellClassName,
}: {
  keyValue:
    | Record<string, string>
    | Array<[string | ReactNode, string | ReactNode]>;
  emptyMessage?: string;
  className?: string;
  defaultCollapsed?: boolean;
  title: string;
  sensitiveKeys?: string[] | ((key: string) => boolean);
  keyCellClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const count = Object.entries(keyValue).length;
  const toggleIsOpen = () => setIsOpen((o) => !o);

  return (
    <div className={cn(className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SubSectionHeading
            className="flex items-center gap-2"
            onClick={toggleIsOpen}
          >
            {isOpen ? (
              <CaretDownIcon className="w-4 h-4 cursor-pointer" />
            ) : (
              <CaretRightIcon className="w-4 h-4 cursor-pointer" />
            )}
            {title} <CountBadge count={count} />
          </SubSectionHeading>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <KeyValueTableV2
            keyValue={keyValue}
            emptyMessage={emptyMessage}
            className="pl-6 mt-1"
            sensitiveKeys={sensitiveKeys}
            keyCellClassName={keyCellClassName}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
