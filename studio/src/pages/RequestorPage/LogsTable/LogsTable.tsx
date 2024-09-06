import {
  getBgColorForLevel,
  getTextColorForLevel,
} from "@/components/Timeline/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOtelTrace } from "@/queries";
import { cn } from "@/utils";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Tabs } from "@radix-ui/react-tabs";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useOrphanLogs } from "../../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { Panels } from "../types";
import { useState } from "react";

type OrphanLog = {
  traceId: string;
  id: number;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string | null;
  args: unknown[];
  createdAt: string;
  updatedAt: string;
  callerLocation?: { file: string; line: string; column: string } | null;
  ignored?: boolean | null;
  service?: string | null;
  relatedSpanId?: string | null;
};

type Props = {
  traceId: string;
  togglePanel: (panelName: keyof Panels) => void;
};

export function LogsTable({ traceId, togglePanel }: Props) {
  const { data: spans } = useOtelTrace(traceId);
  const logs = useOrphanLogs(traceId, spans ?? []);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const columns: ColumnDef<OrphanLog>[] = [
    {
      accessorKey: "level",
      header: "",
      maxSize: 5,
      size: 5,
      cell: ({ row }) => {
        return (
          <div
            className={cn("w-1.5 h-full rounded-full", {
              "bg-red-700": row.original.level === "error",
              "bg-yellow-700": row.original.level === "warn",
              "bg-blue-700": row.original.level === "info",
              "bg-muted": row.original.level === "debug",
            })}
            title={row.original.level.toUpperCase()}
          />
        );
      },
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      maxSize: 145,
      size: 145,
      cell: ({ row }) => {
        const isExpanded = expandedRowId === row.original.id;
        return (
          <div className="grid justify-between h-full text-right">
            <span className="font-mono text-xs text-nowrap max-w-fit whitespace-nowrap">
              {new Date(row.original.timestamp)
                .toISOString()
                .replace("T", " ")
                .replace("Z", "")}
            </span>
            {isExpanded && (
              <p className="text-xs font-mono">
                level:{" "}
                <span
                  className={cn(
                    "uppercase",
                    getTextColorForLevel(row.original.level),
                  )}
                >
                  {row.original.level}
                </span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "message",
      header: "Message",
      size: Number.MAX_SAFE_INTEGER,
      cell: ({ row }) => {
        const isExpanded = expandedRowId === row.original.id;
        return (
          <div className="">
            <div
              className={cn("font-mono text-xs overflow-x-hidden", {
                truncate: !isExpanded,
              })}
            >
              {row.original.message}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <Tabs defaultValue="logs" className="h-full">
      <CustomTabsList>
        <CustomTabTrigger value="logs">Logs ({logs.length})</CustomTabTrigger>
        <div className="flex-grow flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePanel("logs")}
            className="h-6 w-6"
          >
            <Cross1Icon className="h-3 w-3 cursor-pointer" />
          </Button>
        </div>
      </CustomTabsList>
      <CustomTabsContent
        value="logs"
        className="overflow-hidden md:overflow-hidden px-0 h-full"
      >
        {/* @ts-expect-error: TODO: fix the log levels that are reported as strings but need to be string unions */}
        <TableContent
          columns={columns}
          data={logs}
          expandedRowId={expandedRowId}
          setExpandedRowId={setExpandedRowId}
        />
      </CustomTabsContent>
    </Tabs>
  );
}

type TableProps = {
  columns: ColumnDef<OrphanLog>[];
  data: OrphanLog[];
  expandedRowId: number | null;
  setExpandedRowId: (id: number | null) => void;
};

function TableContent({
  columns,
  data,
  expandedRowId,
  setExpandedRowId,
}: TableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <Table className="border-separate border-spacing-y-1">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  className={cn("text-left text-xs font-mono")}
                  style={{
                    width: header.getSize(),
                    minWidth: header.getSize(),
                  }}
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
          table.getRowModel().rows.map((row) => {
            const bgColor = getBgColorForLevel(row.original.level);
            const isExpanded = expandedRowId === row.original.id;
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn("cursor-pointer", bgColor, "hover:bg-muted", {
                  "bg-muted": isExpanded,
                })}
                onClick={() =>
                  setExpandedRowId(isExpanded ? null : row.original.id)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("py-1 px-2")}
                    style={{ minWidth: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center font-mono text-muted-foreground"
            >
              No logs found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
