import { Button } from "@/components/ui/button";

interface ResponsePanelProps {
  statusCode?: number;
  responseBody?: string;
}

export function ResponsePanel({
  statusCode,
  responseBody,
}: ResponsePanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Response Status Bar */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">Status:</span>
          <span className={`font-mono text-sm ${getStatusColor(statusCode)}`}>
            {statusCode || "---"}
          </span>
        </div>
      </div>

      {/* Response Tabs */}
      <div className="flex border-b border-border">
        <Button
          variant="ghost"
          className="px-4 py-2 -mb-px border-b-2 border-primary"
        >
          Response
        </Button>
        <Button
          variant="ghost"
          className="px-4 py-2 -mb-px border-b-2 border-transparent"
        >
          Headers
        </Button>
      </div>

      {/* Response Content */}
      <div className="flex-1 p-4 font-mono text-sm overflow-auto bg-muted">
        {responseBody ? (
          <pre>{responseBody}</pre>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Send a request to see the response
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status?: number): string {
  if (!status) {
    return "text-muted-foreground";
  }
  if (status >= 200 && status < 300) {
    return "text-green-600";
  }
  if (status >= 300 && status < 400) {
    return "text-blue-600";
  }
  if (status >= 400 && status < 500) {
    return "text-yellow-600";
  }
  return "text-red-600";
}
