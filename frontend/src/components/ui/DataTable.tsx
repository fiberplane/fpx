import { ColumnDef, Row, RowData, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { clsx } from "clsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Extend the ColumnMeta type to include headerClassName and cellClassName
//
//   https://github.com/TanStack/table/discussions/4100
//   https://tanstack.com/table/v8/docs/api/core/column-def#meta
//
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Custom prop for optionally handling row clicks */
  handleRowClick?: (row: Row<TData>) => void
}

const rowHasId = <TData,>(row: TData): row is TData & { id: string } => {
  return row && typeof row === "object" && "id" in row && typeof row.id === "string";
}

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
    ...data.every(rowHasId) && ({
      getRowId: (row: TData, index) => rowHasId(row) ? row.id : `${index}`,
    })
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.headerClassName || ""}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => handleRowClick?.(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={clsx(
                    "py-1",
                    cell.column.columnDef.meta?.cellClassName
                  )}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center font-mono">
                No Results
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
