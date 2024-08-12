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
import { useState } from "react";
import { SubSectionHeading } from "./shared";

export const KeyValueRow = ({
  entry,
  sensitiveKeys = [],
}: { entry: [string, string]; sensitiveKeys?: string[] }) => {
  const [key, value] = entry;
  const isSensitive = sensitiveKeys.includes(key);
  const [showSensitive, setShowSensitive] = useState(false);

  return (
    <TableRow>
      <TableCell className="px-0 font-medium min-w-[140px] w-[140px] lg:min-w-[200px] uppercase text-xs text-muted-foreground">
        {key}
      </TableCell>
      <TableCell className="font-mono flex items-center">
        {isSensitive && (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSensitive(!showSensitive)}
                className="mr-2 flex-shrink-0"
              >
                {showSensitive ? (
                  <EyeClosedIcon className="w-3 h-3" />
                ) : (
                  <EyeOpenIcon className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {showSensitive ? "Hide Sensitive Value" : "Show Sensitive Value"}
            </TooltipContent>
          </Tooltip>
        )}
        <span
          className={cn(
            "flex-grow",
            isSensitive && !showSensitive ? "italic text-muted-foreground" : "",
          )}
        >
          {isSensitive && !showSensitive ? "hidden" : value}
        </span>
      </TableCell>
    </TableRow>
  );
};

export function KeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
  sensitiveKeys = [],
}: {
  keyValue: Record<string, string>;
  emptyMessage?: string;
  className?: string;
  sensitiveKeys?: string[];
}) {
  return (
    <div className={cn(className)}>
      <Table className="border-0">
        <TableBody>
          {Object.entries(keyValue).length > 0 ? (
            Object.entries(keyValue).map((entry) => (
              <KeyValueRow
                key={entry[0]}
                entry={entry}
                sensitiveKeys={sensitiveKeys}
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
}: {
  keyValue: Record<string, string>;
  emptyMessage?: string;
  className?: string;
  defaultCollapsed?: boolean;
  title: string;
  sensitiveKeys?: string[];
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
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
