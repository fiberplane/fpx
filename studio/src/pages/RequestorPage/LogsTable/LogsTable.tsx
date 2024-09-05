import { useOrphanLogs } from "../../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/utils";
import type { Panels } from "../types";
import { Tabs } from "@radix-ui/react-tabs";
import { Button } from "@/components/ui/button";
import { Cross1Icon } from "@radix-ui/react-icons";
import { CustomTabsList, CustomTabTrigger, CustomTabsContent } from "../Tabs";
import { useOtelTrace } from "@/queries";
import {
  getBgColorForLevel,
  getTextColorForLevel,
} from "@/components/Timeline/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

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

  const columns: ColumnDef<OrphanLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      maxSize: 80,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-nowrap">
          {new Date(row.original.timestamp)
            .toISOString()
            .replace("T", " ")
            .replace("Z", "")}
        </span>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      maxSize: 30,
      cell: ({ row }) => {
        const textColor = getTextColorForLevel(row.original.level);
        return (
          <span className={cn("font-mono text-xs", textColor)}>
            {row.original.level.toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => {
        return (
          <div className="cursor-pointer" role="button" tabIndex={0}>
            <div className="font-mono text-xs truncate">
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
        className="overflow-hidden md:overflow-hidden px-0"
      >
        {/* @ts-expect-error: TODO: fix the log levels that are reported as strings but need to be string unions */}
        <TableContent columns={columns} data={logs} />
      </CustomTabsContent>
    </Tabs>
  );
}

type TableProps = {
  columns: ColumnDef<OrphanLog>[];
  data: OrphanLog[];
};

function TableContent({ columns, data }: TableProps) {
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
                  className="text-left text-xs font-mono"
                  style={{ width: header.getSize() }}
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
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "cursor-pointer",
                  // "border-l-2 border-b-0 border-transparent",
                  bgColor,
                  "hover:bg-muted",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-1 px-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No logs found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
