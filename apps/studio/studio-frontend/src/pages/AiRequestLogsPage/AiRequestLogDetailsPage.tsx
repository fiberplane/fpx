import { TextOrJsonViewer } from "@/components/Timeline/DetailsList/TextJsonViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

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

const formatHandlerContext = (context: string) => {
  try {
    const contextStr =
      typeof context === "string" ? context : JSON.stringify(context);
    return JSON.parse(`"${contextStr.replace(/^"|"$/g, "")}"`);
  } catch (e) {
    return context;
  }
};

export function AiRequestLogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: logs } = useQuery<AiRequestLog[]>({
    queryKey: ["ai-request-logs"],
    queryFn: async () => {
      const response = await fetch("/v0/ai-request-logs");
      return response.json();
    },
  });

  const log = logs?.find((l) => l.id === Number(id));

  if (!log) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-muted-foreground">Log not found</div>
      </div>
    );
  }

  const parsedLog: ParsedLog = JSON.parse(log.log);

  return (
    <div className="container mx-auto py-8 space-y-6 h-[calc(100vh-40px)] overflow-y-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/internal/ai-logs")}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Logs
        </Button>
        <h1 className="text-2xl font-bold">Log Details</h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Request Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Method:</span>
                <div className="font-mono">{parsedLog.method}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Path:</span>
                <div className="font-mono">{parsedLog.path}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Handler:</span>
                <div className="font-mono break-all">{parsedLog.handler}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">AI Configuration</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Provider:</span>
                <div>{parsedLog.inferenceConfig.aiProvider}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Model:</span>
                <div>{parsedLog.inferenceConfig.model}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Persona:</span>
                <div>{parsedLog.persona}</div>
              </div>
            </div>
          </div>
        </div>

        {parsedLog.history && parsedLog.history.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">History</h3>
            <div className="bg-muted rounded-lg p-4 max-h-[200px] overflow-y-auto">
              {parsedLog.history.map((entry, i) => (
                <div
                  key={i}
                  className="text-sm font-mono mb-2 whitespace-pre-wrap"
                >
                  {formatHandlerContext(entry)}
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedLog.handlerContext && (
          <div>
            <h3 className="font-semibold mb-2">Handler Context</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {formatHandlerContext(parsedLog.handlerContext as string)}
            </pre>
          </div>
        )}

        {parsedLog.openApiSpec && (
          <div>
            <h3 className="font-semibold mb-2">OpenAPI Spec</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{parsedLog.openApiSpec}</code>
            </pre>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Raw Log</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <TextOrJsonViewer
              collapsed={false}
              text={JSON.stringify(parsedLog, null, 2)}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
