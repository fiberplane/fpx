import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";

import { Status } from "@/components/ui/status";
import type { OtelTrace } from "@/queries";
import { Link } from "react-router-dom";
import { Timestamp } from "../RequestDetailsPage/Timestamp";
import { RequestMethod } from "../RequestDetailsPage/shared";
import {
  getRequestMethod,
  getRequestPath,
  getStatusCode,
  isFpxRequestSpan,
  isFpxTraceError,
} from "../RequestDetailsPage/v2/otel-helpers";

// NOTE - `columns` is defined here, in a separate file from the table,
//         in order to support fast refresh with Vite
export const columns: ColumnDef<OtelTrace>[] = [
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
      const requestSpan = props.row.original.spans.find(isFpxRequestSpan);
      const statusCode = requestSpan ? getStatusCode(requestSpan) : 0;
      if (statusCode) {
        return <Status statusCode={statusCode} />;
      }
      return <Status statusCode={undefined} />;
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
      const requestSpan = props.row.original.spans.find(isFpxRequestSpan);
      const method = requestSpan ? getRequestMethod(requestSpan) : "—";
      return <RequestMethod method={method} />;
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
      const requestSpan = props.row.original.spans.find(isFpxRequestSpan);
      const path = requestSpan ? getRequestPath(requestSpan) : "—";
      return (
        <Link
          className="hover:underline"
          to={`/requests/otel/${props.row.original.traceId}`}
          onClick={(e) => {
            // We have a navigation handler for selecting the row anyhow, so we don't want to double-trigger that
            // Thus, let's stop propagation
            e.stopPropagation();
          }}
        >
          {path}
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
      const requestSpan = props.row.original.spans.find(isFpxRequestSpan);
      const endTime = requestSpan?.end_time;
      const startTime = requestSpan?.start_time;
      if (!endTime || !startTime) {
        return <span className="font-mono text-xs">—</span>;
      }
      const duration =
        new Date(endTime).getTime() - new Date(startTime).getTime();
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
    cell: (props) => {
      const requestSpan = props.row.original.spans.find(isFpxRequestSpan);
      const startTime = requestSpan?.start_time;
      if (!startTime) {
        return <span>—</span>;
      }
      return <Timestamp date={startTime} />;
    },
    meta: {
      // NOTE - This is how to hide a cell depending on breakpoint!
      headerClassName: "hidden md:table-cell w-36",
      cellClassName: "hidden md:table-cell font-mono text-xs",
    },
  },
];
