import { useMemo } from "react"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MizuTrace } from "@/queries/decoders"

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends MizuTrace, TValue>({
  columns,
  data,
  filter
}: DataTableProps<TData, TValue> & { filter: LevelFilter }) {
  // HACK - Filter data here depending on table
  // TODO - Move filtering elsewhere, use react-table like a cool kid
  const filteredTraces = useMemo(() => {
    if (filter === "all") {
      return data
    }
    return data.filter(trace => trace.logs.some(log => log.level === filter));
  }, [data, filter])

  // Create a table instance
  const table = useReactTable({
    data: filteredTraces,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName || ""}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
