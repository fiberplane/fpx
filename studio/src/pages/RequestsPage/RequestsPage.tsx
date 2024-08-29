import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MIZU_TRACES_KEY, type OtelTrace, useOtelTraces } from "@/queries";
import { cn } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { type Row, getPaginationRowModel } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isFpxTraceError } from "../RequestDetailsPage/v2/otel-helpers";
import { columns } from "./columns";
import { useTraceContext } from "@/contexts";
import { useQueryClient } from "@tanstack/react-query";

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const RequestsTable = ({
  traces,
  filter,
}: { traces: OtelTrace[]; filter: LevelFilter }) => {
  const navigate = useNavigate();

  const { setCurrentTraceId } = useTraceContext();

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
    (row: Row<OtelTrace>) => {
      setCurrentTraceId(row.original.traceId);
      navigate(`/requests/otel/${row.original.traceId}`);
    },
    [navigate, setCurrentTraceId],
  );

  return (
    <DataTable
      columns={columns}
      data={filteredTraces ?? []}
      handleRowClick={handleRowClick}
      getPaginationRowModel={getPaginationRowModel<OtelTrace>}
    />
  );
};

export function RequestsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const otelTraces = useOtelTraces();

  const tracesWithErrors = useMemo(() => {
    return otelTraces.data?.filter(isFpxTraceError);
  }, [otelTraces.data]);

  useEffect(() => {
    if (otelTraces.data && otelTraces.data.length > 0) {
      const first20Traces = otelTraces.data.slice(0, 20);
      for (const trace of first20Traces) {
        console.log("Prefetching trace", trace.traceId);
        queryClient.prefetchQuery({
          queryKey: [MIZU_TRACES_KEY, trace.traceId],
          queryFn: () =>
            fetch(`/v1/traces/${trace.traceId}/spans`).then((r) => r.json()),
        });
      }
    }
  }, [otelTraces.data, queryClient.prefetchQuery]);

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
                toast({
                  title: "Successfully deleted all traces",
                  variant: "destructive",
                });
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
        <RequestsTable traces={tracesWithErrors ?? []} filter="error" />
      </TabsContent>
    </Tabs>
  );
}
