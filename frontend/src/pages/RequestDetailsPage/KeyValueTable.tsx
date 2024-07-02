import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useMemo } from "react";

export function KeyValueTable({
  keyValue,
  caption,
}: { keyValue: Record<string, string>; caption?: string }) {
  const tableEntries = useMemo(() => {
    return Object.entries(keyValue);
  }, [keyValue]);
  return (
    <div id={caption?.toLowerCase()} className="border rounded-lg">
      <div className="bg-muted/70 rounded-t-lg flex items-center text-sm p-2 gap-2">
        <h5>{caption}</h5>
        <span className="text-xs text-muted-foreground">
          {Object.keys(keyValue).length}
        </span>
      </div>
      <Table className="bg-muted/20 rounded-lg">
        <TableBody>
          {tableEntries.length > 0 ? (
            tableEntries.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium min-w-[140px] lg:min-w-[200px] uppercase text-xs text-muted-foreground">
                  {key}
                </TableCell>
                <TableCell className="font-mono">{value}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="text-muted-foreground italic" colSpan={2}>
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
