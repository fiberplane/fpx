import { CountBadge } from "@/components/CountBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { type ReactNode, useState } from "react";
import { SubSectionHeading } from "../../shared";
import { KeyValueRow } from "./KeyValueRow";

export function KeyValueTable({
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

type Props = {
  keyValue:
    | Record<string, string>
    | Array<[string | ReactNode, string | ReactNode]>;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
  defaultCollapsed?: boolean;
  title: string;
  sensitiveKeys?: string[] | ((key: string) => boolean);
  keyCellClassName?: string;
};

export function CollapsibleKeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
  defaultCollapsed = true,
  title,
  sensitiveKeys = [],
  keyCellClassName,
  headerClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const count = Object.entries(keyValue).length;
  const toggleIsOpen = () => setIsOpen((o) => !o);

  return (
    <div className={cn(className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SubSectionHeading
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              headerClassName,
            )}
            onClick={toggleIsOpen}
          >
            <div className="flex items-center text-left gap-2">
              {isOpen ? (
                <CaretDownIcon className="w-4 h-4 cursor-pointer" />
              ) : (
                <CaretRightIcon className="w-4 h-4 cursor-pointer" />
              )}
              {title}
            </div>
            <CountBadge count={count} />
          </SubSectionHeading>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <KeyValueTable
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
