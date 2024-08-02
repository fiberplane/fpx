import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebsocketQueryInvalidation } from "@/hooks";
import { type MizuTrace, type OtelSpan, useMizuTracesV2 } from "@/queries";
import { useOtelTraces } from "@/queries/hotel";
import { cn } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { Row, getPaginationRowModel } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { columns } from "./columns";

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const RequestsTable = ({
  traces,
  filter,
}: { traces: OtelSpan[]; filter: LevelFilter }) => {
  const navigate = useNavigate();

  const filteredTraces = useMemo(() => {
    if (filter === "all") {
      return traces;
    }
    // FIXME - Look for any exceptions or error logs
    //
    // return traces.filter((trace) =>
    //   trace.logs.some((log) => log.level === filter),
    // );
    return traces;
  }, [traces, filter]);

  const handleRowClick = useCallback(
    (row: Row<OtelSpan>) => {
      navigate(`/requests/${row.original.trace_id}`);
    },
    [navigate],
  );

  return (
    <DataTable
      columns={columns}
      data={filteredTraces ?? []}
      handleRowClick={handleRowClick}
      getPaginationRowModel={getPaginationRowModel<OtelSpan>}
    />
  );
};

export function RequestsPage() {
  // const query = useMizuTraces();
  const queryV2 = useMizuTracesV2();

  useEffect(() => {
    if (queryV2.data) {
      console.log("traces with spans:", queryV2.data);
    }
  }, [queryV2.data]);

  const otelTraces = useOtelTraces();
  useEffect(() => {
    if (otelTraces.data) {
      console.log("otel traces:", otelTraces.data);
    }
  }, [otelTraces.data]);

  // Will add new fpx-requests as they come in by refetching
  // In the future, we'll want to build a better ux around this (not auto refresh the table)
  useWebsocketQueryInvalidation();

  return (
    <Tabs
      defaultValue="all"
      className={cn(
        "py-4 px-2",
        "sm:px-4 sm:py-4",
        "md:px-6 md:py-6",
        "h-full",
        "overflow-y-auto",
        "grid gap-2 grid-rows-[auto_1fr]",
      )}
    >
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Error Responses</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1"
            onClick={() => {
              fetch("/v1/traces/delete-all-hack", {
                method: "POST",
              }).then(() => {
                otelTraces.refetch();
                alert("Successfully deleted all");
              });
            }}
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Delete All
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <RequestsTable traces={otelTraces.data ?? []} filter="all" />
      </TabsContent>
      <TabsContent value="error">
        <RequestsTable traces={otelTraces.data ?? []} filter="error" />
      </TabsContent>
    </Tabs>
  );
}
