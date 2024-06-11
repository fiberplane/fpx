import { useHandler } from "@fiberplane/hooks";
import {
  type ColumnDef,
  type Row,
  type RowData,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { clsx } from "clsx";

import { useKeySequence } from "@/hooks";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

// Extend the ColumnMeta type to include headerClassName and cellClassName
//
//   https://github.com/TanStack/table/discussions/4100
//   https://tanstack.com/table/v8/docs/api/core/column-def#meta
//
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Custom prop for optionally handling row clicks */
  handleRowClick?: (row: Row<TData>) => void;
}

const rowHasId = <TData,>(row: TData): row is TData & { id: string } => {
  return (
    row && typeof row === "object" && "id" in row && typeof row.id === "string"
  );
};

/**
 * Custom component (not part of shadcn/ui) to handle more complex data interactions than the
 * out of the box table component
 *
 * Features:
 * - Add an optional prop for a click handler when the entire row is clicked
 * - Allow setting header and cell className prop through column definition metadata
 * - If all the rows have an `id` property of type `string`, set that id as the row id
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  handleRowClick,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // If all the data have an `id` property of type `string`, set that to the row id
    ...(data.every(rowHasId) && {
      getRowId: (row: TData, index) => (rowHasId(row) ? row.id : `${index}`),
    }),
  });

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const rows = table.getRowModel().rows;

  const handleNextRow = useHandler(() => {
    setSelectedRowIndex((prevIndex) => {
      if (prevIndex === null) return 0;
      if (prevIndex + 1 >= rows.length) return prevIndex;

      return prevIndex + 1;
    });
  });

  const handlePrevRow = useHandler(() => {
    setSelectedRowIndex((prevIndex) => {
      if (prevIndex === null) return 0;
      if (prevIndex - 1 < 0) return prevIndex;
      return prevIndex - 1;
    });
  });

  const handleRowSelect = useHandler(() => {
    if (selectedRowIndex !== null && rows.length > 0) {
      const selectedRow = rows[selectedRowIndex];
      handleRowClick?.(selectedRow);
    }
  });

  useKeySequence(["j"], handleNextRow);
  useKeySequence(["k"], handlePrevRow);
  useKeySequence(["Enter"], handleRowSelect);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.columnDef.meta?.headerClassName || ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, rowIdx) => {
              // console.log("row", row.getIsSelected(), row.id)
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick?.(row)}
                  onMouseEnter={() => setSelectedRowIndex(rowIdx)}
                  onMouseLeave={() => setSelectedRowIndex(null)}
                  className={`${rowIdx === selectedRowIndex ? "bg-muted/50" : ""} transition-none`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={clsx(
                        "py-1",
                        cell.column.columnDef.meta?.cellClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center font-mono"
              >
                No Results
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
