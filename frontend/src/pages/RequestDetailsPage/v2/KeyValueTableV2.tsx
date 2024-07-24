import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/utils";
import { useMemo } from "react";

export function KeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
}: {
  keyValue: Record<string, string>;
  emptyMessage?: string;
  className?: string;
}) {
  const tableEntries = useMemo(() => {
    return Object.entries(keyValue);
  }, [keyValue]);
  return (
    <div className={cn(className)}>
      <Table className="border-0">
        <TableBody className="">
          {tableEntries.length > 0 ? (
            tableEntries.map(([key, value]) => (
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
