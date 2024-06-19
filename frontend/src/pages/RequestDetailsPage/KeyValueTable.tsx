import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function KeyValueTable({
  keyValue,
  caption,
}: { keyValue: Record<string, string>; caption?: string }) {
  return (
    <div id={caption?.toLowerCase()} className="border rounded-xl">
      <div className="bg-muted/70 rounded-t-xl flex items-center text-sm p-2 gap-2">
        <h5>{caption}</h5>
        <span className="text-xs text-muted-foreground">
          {Object.keys(keyValue).length}
        </span>
      </div>
      <Table className="bg-muted/20 rounded-xl">
        <TableBody>
          {Object.entries(keyValue).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium w-[200px] uppercase text-xs text-muted-foreground">
                {key}
              </TableCell>
              <TableCell className="font-mono">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
