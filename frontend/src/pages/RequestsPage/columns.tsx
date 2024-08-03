import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";

import { Status } from "@/components/ui/status";
import type { OtelSpan } from "@/queries";
import { Link } from "react-router-dom";
import { Timestamp } from "../RequestDetailsPage/Timestamp";
import { RequestMethod } from "../RequestDetailsPage/shared";
import {
  getRequestMethod,
  getRequestPath,
  getStatusCode,
  isFpxTraceError,
} from "../RequestDetailsPage/v2/otel-helpers";

// NOTE - `columns` is defined here, in a separate file from the table,
//         in order to support fast refresh with Vite
export const columns: ColumnDef<OtelSpan>[] = [
  {
    id: "isError",
    // TODO - Implement isError...
    accessorFn: (row) => isFpxTraceError(row),
    header: () => <span className="sr-only">Icon</span>,
    cell: (props) => {
      return (
        <span className="text-gray-300">
          {props.row.getValue("isError") ? (
            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
          ) : null}
        </span>
      );
    },
    meta: {
      headerClassName: "hidden sm:table-cell w-[32px]",
      cellClassName: "hidden sm:table-cell",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (props) => {
      return <Status statusCode={getStatusCode(props.row.original)} />;
    },
    meta: {
      headerClassName: "w-20",
      cellClassName: "font-mono",
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: (props) => {
      return <RequestMethod method={getRequestMethod(props.row.original)} />;
    },
    meta: {
      headerClassName: "w-20",
      cellClassName: "font-mono",
    },
  },
  {
    accessorKey: "path",
    header: "Path",
    cell: (props) => {
      return (
        <Link
          className="hover:underline"
          to={`/requests/${props.row.original.trace_id}`}
          onClick={(e) => {
            // We have a navigation handler for selecting the row anyhow, so we don't want to double-trigger that
            // Thus, let's stop propagation
            e.stopPropagation();
          }}
        >
          {getRequestPath(props.row.original)}
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
      headerClassName: "hidden sm:table-cell w-[80px]",
      cellClassName: "hidden sm:table-cell font-mono",
    },
    cell: (props) => {
      const duration =
        new Date(props.row.original.end_time).getTime() -
        new Date(props.row.original.start_time).getTime();
      const formattedDuration =
        duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`;
      return <span className="font-mono text-xs">{formattedDuration}</span>;
    },
  },
  // TODO - Add size column
  // {
  //   accessorKey: "size",
  //   header: "Size",
  //   meta: {
  //     headerClassName: "hidden md:table-cell w-[80px]",
  //     cellClassName: "hidden md:table-cell font-mono",
  //   },
  // },
  {
    id: "timestamp",
    header: "Timestamp",
    cell: (props) => <Timestamp date={props.row.original.start_time} />,
    meta: {
      // NOTE - This is how to hide a cell depending on breakpoint!
      headerClassName: "hidden md:table-cell w-36",
      cellClassName: "hidden md:table-cell font-mono text-xs",
    },
  },
];
