import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/utils";
import { useCallback, useMemo, useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { CountBadge } from "@/components/CountBadge";
import { SubSectionHeading } from "./shared";
import { CaretDownIcon, CaretRightIcon, EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

export const KeyValueRow = ({ entry, sensitiveKeys = [] }: { entry: [string, string]; sensitiveKeys?: string[] }) => {
  const [key, value] = entry;
  const isSensitive = sensitiveKeys.includes(key);
  const [showSensitive, setShowSensitive] = useState(false);

  return (
    <TableRow>
      <TableCell className="px-0 font-medium min-w-[140px] w-[140px] lg:min-w-[200px] uppercase text-xs text-muted-foreground">{key}</TableCell>
      <TableCell className="font-mono">
        {isSensitive && !showSensitive ? "*****" : value}
        {isSensitive && (
          <Button variant="ghost" size="icon" onClick={() => setShowSensitive(!showSensitive)} className="ml-2">
            {showSensitive ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </Button>
        )}
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
        <TableBody className="">
          {Object.entries(keyValue).length > 0 ? (
            Object.entries(keyValue).map((entry) => (
              <KeyValueRow key={entry[0]} entry={entry} sensitiveKeys={sensitiveKeys} />
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
  const count = useMemo(() => Object.entries(keyValue).length, [keyValue]);
  const toggleIsOpen = useCallback(() => setIsOpen(o => !o), []);

  return (
    <div className={cn(className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SubSectionHeading className="flex items-center gap-2" onClick={toggleIsOpen}>
            {isOpen ? <CaretDownIcon className="w-4 h-4 cursor-pointer" /> : <CaretRightIcon className="w-4 h-4 cursor-pointer" />}
            {title} <CountBadge count={count} />
          </SubSectionHeading>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <KeyValueTableV2 keyValue={keyValue} emptyMessage={emptyMessage} className="pl-6 mt-1" sensitiveKeys={sensitiveKeys} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}