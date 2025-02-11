import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

interface AiRequestLog {
  id: number;
  log: string;
  createdAt: string;
}

interface ParsedLog {
  fpApiKey?: string;
  inferenceConfig: {
    aiProvider: string;
    model: string;
  };
  persona: string;
  method: string;
  path: string;
  handler: string;
  handlerContext?: null | string;
  history?: string[];
  openApiSpec?: string;
  middleware?: unknown;
  middlewareContext?: null | string;
}

const columns: ColumnDef<AiRequestLog>[] = [
  {
    accessorKey: "createdAt",
    header: "Timestamp",
    cell: ({ row }) => (
      <div className="font-mono text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleTimeString()}
      </div>
    ),
  },
  {
    accessorKey: "log",
    header: "Request",
    cell: ({ row }) => {
      const parsedLog: ParsedLog = JSON.parse(row.original.log);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={parsedLog.method === "GET" ? "secondary" : "default"}
              className="font-mono"
            >
              {parsedLog.method}
            </Badge>
            <span className="font-mono text-sm text-muted-foreground">
              {parsedLog.path}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">
              provider: {parsedLog.inferenceConfig.aiProvider}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {parsedLog.inferenceConfig.model}
            </span>
            {parsedLog.persona && (
              <Badge variant="outline" className="text-xs bg-muted">
                persona: {parsedLog.persona}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">
            {parsedLog.handler?.slice(0, 50)}...
          </div>
        </div>
      );
    },
  },
];

export function AiRequestLogsPage() {
  const navigate = useNavigate();

  const { data: logs, isLoading } = useQuery<AiRequestLog[]>({
    queryKey: ["ai-request-logs"],
    queryFn: async () => {
      const response = await fetch("/v0/ai-request-logs");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-muted-foreground">Loading logs...</div>
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
          <div className="rounded-lg p-2 bg-muted">
            {/* biome-ignore lint/a11y/noSvgWithoutTitle: internal page, we do not care */}
            <svg
              aria-label="No logs icon"
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 8V4H8" />
              <rect height="12" rx="2" width="12" x="8" y="8" />
              <path d="M4 16V4" />
              <path d="M4 4H2" />
              <path d="M4 8H2" />
              <path d="M4 12H2" />
              <path d="M4 16H2" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-muted-foreground">
            No AI Request Logs
          </div>
          <div className="text-sm text-muted-foreground max-w-md">
            Logs will appear here after making requests through the API. Try
            making some requests to see them show up here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Request Logs</h1>
        <div className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </div>
      </div>

      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={logs}
          handleRowClick={(row) =>
            navigate(`/internal/ai-logs/${row.original.id}`)
          }
        />
      </div>
    </div>
  );
}
