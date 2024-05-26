import {
  ExclamationTriangleIcon,
  InfoCircledIcon
} from "@radix-ui/react-icons"
import { ColumnDef, RowData, createColumnHelper } from "@tanstack/react-table"

import { formatDate } from "@/utils/utils"
import type { MizuTrace } from "@/queries/decoders"
import { RequestDetails } from "./RequestDetails"

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

const columnHelper = createColumnHelper<MizuTrace>()

// NOTE - Column is defined here, in a separate file from the DataTable to support fast refresh with Vite
export const columns: ColumnDef<MizuTrace>[] = [
  {
    id: "isError",
    accessorFn: row => row.logs.some(l => l.level === "error"),
    header: () => <span className="sr-only">Icon</span>,
    cell: (props) => {
      return (
        <>
          {props.row.getValue("isError") ? <ExclamationTriangleIcon className="h-3.5 w-3.5" /> : <InfoCircledIcon className="h-3.5 w-3.5" />}
        </>
      )
    },
    meta: {
      headerClassName: "w-[32px]",
    }
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "description",
    header: "Summary",
    meta: {
      headerClassName: "",
      cellClassName: "font-medium"
    }
  },
  {
    id: "timestamp",
    header: "Timestamp",
    accessorFn: row => formatDate(new Date(row.logs?.[0]?.timestamp)),
    meta: {
      // NOTE - This is how to hide a cell depending on breakpoint!
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell font-mono text-xs"
    }
  },
  columnHelper.display({
    id: "open",
    cell: (props) => <RequestDetails trace={props.row.original} />,
    meta: {
      headerClassName: "",
      cellClassName: "flex items-center space-x-2"
    }
  })
]