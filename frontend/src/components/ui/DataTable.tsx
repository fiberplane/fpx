import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKeySequence } from "@/hooks";
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
import { useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

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
      {getPaginationRowModel && <DataTablePagination table={table} />}
    </div>
  );
}

function DataTablePagination<TData>({ table }: { table: TableType<TData> }) {
  const currentPageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const goToPage = (pageIndex: number) => table.setPageIndex(pageIndex);

  const pageIndexButtons = useMemo(() => {
    const pageIndexes: Array<number> = [];

    if (pageCount < 2) {
      return pageIndexes;
    }

    if (currentPageIndex > 0) {
      pageIndexes.push(currentPageIndex - 1);
    }

    pageIndexes.push(currentPageIndex);

    if (currentPageIndex < pageCount - 1) {
      pageIndexes.push(currentPageIndex + 1);
    }
    return pageIndexes;
  }, [currentPageIndex, pageCount]);

  return (
    <div className="mt-4">
      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            {canPreviousPage && (
              <PaginationItem>
                <PaginationPrevious onClick={() => table.previousPage()} />
              </PaginationItem>
            )}
            {currentPageIndex > 3 && (
              <PaginationItem>
                <PaginationLink>
                  <PaginationLink onClick={() => table.firstPage()}>
                    1
                  </PaginationLink>
                </PaginationLink>
              </PaginationItem>
            )}
            {currentPageIndex > 2 && (
              <PaginationItem>
                <PaginationLink>
                  <PaginationEllipsis />
                </PaginationLink>
              </PaginationItem>
            )}
            {pageIndexButtons.map((index) => {
              return (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={index === currentPageIndex}
                    onClick={() => goToPage(index)}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {currentPageIndex < pageCount - 3 && (
              <>
                <PaginationItem>
                  <PaginationLink>
                    <PaginationEllipsis />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => table.lastPage()}>
                    {pageCount}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            {canNextPage && (
              <PaginationItem>
                <PaginationNext onClick={() => table.nextPage()} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
      <PageSizeMenu table={table} />
    </div>
  );
}

function PageSizeMenu<TData>({ table }: { table: TableType<TData> }) {
  const pageSize = table.getState().pagination.pageSize;
  const PAGE_SIZE_OPTIONS = useMemo(() => [10, 20, 30, 40, 50], []);

  return (
    <div className="flex text-gray-300 items-center gap-2 py-2 mt-4 mb-2 justify-center">
      <select
        value={pageSize}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value));
        }}
        className="fg-foreground bg-background text-sm"
      >
        {PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
          <option key={pageSizeOption} value={pageSizeOption}>
            Show {pageSizeOption} Results Per Page
          </option>
        ))}
      </select>
    </div>
  );
}
