import { TrashIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type MizuTrace, useMizuTraces } from "@/queries";
import { Row, getPaginationRowModel } from "@tanstack/react-table";
import { columns } from "./columns";

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const RequestsTable = ({
  traces,
  filter,
}: { traces: MizuTrace[]; filter: LevelFilter }) => {
  const navigate = useNavigate();

  const filteredTraces = useMemo(() => {
    if (filter === "all") {
      return traces;
    }
    return traces.filter((trace) =>
      trace.logs.some((log) => log.level === filter),
    );
  }, [traces, filter]);

  const handleRowClick = useCallback(
    (row: Row<MizuTrace>) => {
      navigate(`/requests/${row.id}`);
    },
    [navigate],
  );

  return (
    <DataTable
      columns={columns}
      data={filteredTraces ?? []}
      handleRowClick={handleRowClick}
      getPaginationRowModel={getPaginationRowModel<MizuTrace>}
    />
  );
};

export function RequestsPage() {
  const queryClient = useQueryClient();
  const query = useMizuTraces();

  useEffect(() => {
    const socket = new WebSocket("/ws");

    socket.onopen = () => {
      console.log("Connected to update server");
    };

    socket.onmessage = (ev) => {
      console.log("Received message", ev.data);
      const data: string[] = JSON.parse(ev.data);
      queryClient.invalidateQueries(...data);
    };

    socket.onclose = (ev) => {
      console.log("Disconnected from update server", ev);
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Error Responses</TabsTrigger>
          <TabsTrigger value="ignored" className="hidden sm:flex">
            With Any Errors
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1"
            onClick={() => {
              fetch("/v0/logs/delete-all-hack", {
                method: "POST",
              }).then(() => {
                query.refetch();
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
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>
              Inspect requests to your development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestsTable traces={query.data ?? []} filter="all" />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="error">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>4xx and 5xx Errors</CardTitle>
            <CardDescription>
              View requests that resulted in 4xx or 5xx errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestsTable traces={query.data ?? []} filter="error" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
