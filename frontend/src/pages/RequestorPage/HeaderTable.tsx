import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function HeaderTable({ headers }: { headers: Record<string, string> }) {
  return (
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
  );
}
