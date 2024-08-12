import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/utils";
import { useCallback, useMemo, useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { CountBadge } from "@/components/CountBadge";
import { SubSectionHeading } from "./shared";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";

export function KeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
}: {
  keyValue: Record<string, string>;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <Table className="border-0">
        <TableBody className="">
          {Object.entries(keyValue).length > 0 ? (
            Object.entries(keyValue).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="px-0 font-medium min-w-[140px] w-[140px] lg:min-w-[200px] uppercase text-xs text-muted-foreground">
                  {key}
                </TableCell>
                <TableCell className="font-mono">{value}</TableCell>
              </TableRow>
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
}: {
  keyValue: Record<string, string>;
  emptyMessage?: string;
  className?: string;
  defaultCollapsed?: boolean;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const count = useMemo(() => Object.entries(keyValue).length, [keyValue]);
  const toggleIsOpen = useCallback(() => setIsOpen(o => !o), []);

  // TODO - If count is 0, do not render the collapsible

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
          <KeyValueTableV2 keyValue={keyValue} emptyMessage={emptyMessage} className="pl-6 mt-1" />
        </CollapsibleContent>
      </Collapsible>
      {/* {isCollapsed && (
        <div className="flex items-center">
          <span className="font-medium">Request Headers</span>
          <span className="ml-2 text-gray-400">({Object.entries(keyValue).length})</span>
          <span className="ml-2 text-gray-400">
            {Object.entries(keyValue)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" | ")}
          </span>
        </div>
      )} */}
    </div>
  );
}