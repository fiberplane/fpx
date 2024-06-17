import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/ui/DataTable";
import type { MizuTrace } from "@/queries";
import { columns } from "./columns";

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

export const RequestsTable = ({
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

  return (
    <DataTable
      columns={columns}
      data={filteredTraces ?? []}
      handleRowClick={(row) => navigate(`/requests/${row.id}`)}
    />
  );
};
