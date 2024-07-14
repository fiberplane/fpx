import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function HeaderTable({ headers, className }: { headers: Record<string, string>, className?: string }) {
  return (
    <div className={className}>
      <Table>
        <TableBody>
          {Object.entries(headers).map((header) => (
            <TableRow key={header[0]}>
              <TableCell className="font-medium w-[200px] text-gray-400">
                {header[0]}
              </TableCell>
              <TableCell>{header[1]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
