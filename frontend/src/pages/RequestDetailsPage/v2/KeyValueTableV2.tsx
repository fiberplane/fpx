import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/utils";
import { useCallback, useMemo, useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export function KeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
  defaultMaxRows = 10,
  defaultCollapsed = true,
}: {
  keyValue: Record<string, string>;
  emptyMessage?: string;
  className?: string;
  defaultMaxRows?: number;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(c => !c)
  }, []);
  const tableEntries = useMemo(() => {
    return Object.entries(keyValue);
  }, [keyValue]);

  const displayedEntries = useMemo(() => {
    return isCollapsed ? tableEntries.slice(0, defaultMaxRows) : tableEntries;
  }, [isCollapsed, tableEntries, defaultMaxRows]);

  const hiddenHeadersCount = useMemo(() => {
    return tableEntries.length - displayedEntries.length;
  }, [tableEntries, displayedEntries]);

  return (
    <div className={cn(className)}>
      <Table className="border-0">
        <TableBody className="">
          {displayedEntries.length > 0 ? (
            displayedEntries.map(([key, value]) => (
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
          {tableEntries.length > defaultMaxRows && (
            <Collapsible open={!isCollapsed} onOpenChange={toggleCollapsed}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="mt-2 text-blue-500">
                  
                  {isCollapsed ? `${hiddenHeadersCount} hidden headers - Click to see more` : "Collapse"}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </TableBody>
      </Table>

    </div>
  );
}