import {
  ExclamationTriangleIcon,
  InfoCircledIcon
} from "@radix-ui/react-icons"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

import { formatDate } from "@/utils/utils"
import type { MizuTrace } from "@/queries/decoders"
import { RequestSheet } from "./RequestSheet"

const columnHelper = createColumnHelper<MizuTrace>()

// NOTE - `columns` is defined here, in a separate file from the table,
//         in order to support fast refresh with Vite
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
    meta: {
      headerClassName: "w-[80px]",
      cellClassName: "font-mono"
    }
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
    cell: (props) => <RequestSheet trace={props.row.original} />,
    meta: {
      headerClassName: "",
      cellClassName: "flex items-center space-x-2"
    }
  })
]