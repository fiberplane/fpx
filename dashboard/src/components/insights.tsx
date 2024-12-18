import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function Insights() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {new Array(20).fill(false).map((_, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">1234</TableCell>
            <TableCell>/</TableCell>
            <TableCell>GET</TableCell>
            <TableCell className="text-right">
              {new Date().toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
