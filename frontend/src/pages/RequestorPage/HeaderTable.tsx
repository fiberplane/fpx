import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function HeaderTable({ headers }: { headers: Record<string, string> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Name</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(headers).map((header) => (
          <TableRow key={header[0]}>
            <TableCell className="font-medium">{header[0]}</TableCell>
            <TableCell>{header[1]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
