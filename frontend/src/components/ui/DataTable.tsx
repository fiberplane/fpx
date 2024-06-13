import { useHandler } from "@fiberplane/hooks";
import {
  type ColumnDef,
  PaginationState,
  type Row,
  type RowData,
  RowModel,
  Table as TableType,
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

type Options = {
  initialSync: boolean;
};

type GetPaginationRowModel<TData extends RowData> = (
  opts?: Options,
) => (table: TableType<TData>) => () => RowModel<TData>;

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Custom prop for optionally handling row clicks */
  handleRowClick?: (row: Row<TData>) => void;
  getPaginationRowModel?: GetPaginationRowModel<TData>;
}

const rowHasId = <TData,>(row: TData): row is TData & { id: string } => {
  return (
    row &&
    typeof row === "object" &&
    "id" in row &&
    (typeof row.id === "string" || typeof row.id === "number")
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
  getPaginationRowModel,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // If all the data have an `id` property of type `string` or 'number', set that to the row id
    ...(data.every(rowHasId) && {
      getRowId: (row: TData, index) => (rowHasId(row) ? row.id : `${index}`),
    }),
    ...(getPaginationRowModel
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          onPaginationChange: setPagination, //update the pagination state when internal APIs mutate the pagination state
          state: {
            //...
            pagination,
          },
        }
      : {}),
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
            table.getRowModel().rows.map((row, rowIdx) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => handleRowClick?.(row)}
                onMouseEnter={() => setSelectedRowIndex(rowIdx)}
                onMouseLeave={() => setSelectedRowIndex(null)}
                className={clsx(
                  { "bg-muted/50": rowIdx === selectedRowIndex },
                  "transition-none",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={clsx(
                      "py-1",
                      cell.column.columnDef.meta?.cellClassName,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
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
      {getPaginationRowModel && (
        <div className="flex items-center gap-2 py-2 pt-8 justify-center">
          <button
            className="inline-block border rounded p-1 disabled:opacity-50 hover:bg-muted disabled:hover:bg-transparent"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="inline-block border rounded p-1 disabled:opacity-50 hover:bg-muted disabled:hover:bg-transparent"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </strong>
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
          <button
            className="inline-block border rounded p-1 disabled:opacity-50 hover:bg-muted disabled:hover:bg-transparent"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="inline-block border rounded p-1 disabled:opacity-50 hover:bg-muted disabled:hover:bg-transparent"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
        </div>
      )}
    </div>
  );
}
