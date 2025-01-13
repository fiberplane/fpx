import { RequestPanel } from "../request-panel/RequestPanel";
import { ResponsePanel } from "../response-panel/ResponsePanel";

interface RequestViewerProps {
  method: string;
  path: string;
}

export function RequestViewer({ method, path }: RequestViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <div className="flex flex-col min-h-0">
          <RequestPanel method={method} path={path} />
        </div>
        <div className="flex flex-col min-h-0">
          <ResponsePanel />
        </div>
      </div>
    </div>
  );
} 