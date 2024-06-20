import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";

import type { MizuTrace } from "@/queries";
import { Link } from "react-router-dom";
import { TimeAgo } from "../RequestDetailsPage/TimeAgo";

// NOTE - `columns` is defined here, in a separate file from the table,
//         in order to support fast refresh with Vite
export const columns: ColumnDef<MizuTrace>[] = [
  {
    id: "isError",
    accessorFn: (row) => row.logs.some((l) => l.level === "error"),
    header: () => <span className="sr-only">Icon</span>,
    cell: (props) => {
      return (
        <>
          {props.row.getValue("isError") ? (
            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
          ) : (
            <InfoCircledIcon className="h-3.5 w-3.5" />
          )}
        </>
      );
    },
    meta: {
      headerClassName: "w-[32px]",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      headerClassName: "w-[80px]",
      cellClassName: "font-mono",
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    meta: {
      headerClassName: "w-[80px]",
      cellClassName: "font-mono",
    },
  },
  {
    accessorKey: "path",
    header: "Path",
    cell: (props) => {
      return (
        <Link className="hover:underline" to={`/requests/${props.row.id}`}>
          {props.row.original.path}
        </Link>
      );
    },
    meta: {
      headerClassName: "",
      cellClassName: "font-mono",
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    meta: {
      headerClassName: "w-[80px]",
      cellClassName: "font-mono",
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    meta: {
      headerClassName: "w-[80px]",
      cellClassName: "font-mono",
    },
  },
  {
    id: "timestamp",
    header: "Timestamp",
    cell: (props) => (
      <TimeAgo
        date={props.row.original.logs?.[0]?.timestamp}
        fallbackWithTime
        fallbackWithDate={false}
      />
    ),
    meta: {
      // NOTE - This is how to hide a cell depending on breakpoint!
      headerClassName: "hidden md:table-cell w-36",
      cellClassName: "hidden md:table-cell font-mono text-xs",
    },
  },
];
