import { Method } from "@/components/Method";
import { StatusCode } from "@/components/StatusCode";
import { cn } from "@/utils";

export type RequestInfo = {
  requestMethod: string;
  requestUrl: string;
  responseStatusCode: string | number;
};

type Props = {
  response: RequestInfo;
  transformUrl?: (url: string) => string;
  className?: string;
};

export function ResponseSummary({
  response,
  transformUrl = (url: string) => url,
  className,
}: Props) {
  // Meaning, the request never even fired - This is unlikely to occur in the current UI, is more of an artifact of when we failed to proxy a request from the Studio UI
  const isFailure = !response.responseStatusCode;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Method method={response.requestMethod} />
      <StatusCode
        status={Number(response.responseStatusCode)}
        isFailure={isFailure}
      />
      <span className="truncate font-mono text-xs">
        {transformUrl(response.requestUrl)}
      </span>
    </div>
  );
}

export function ResponseSummaryContainer({
  response,
  transformUrl,
  className,
  dimmed = false,
}: Props & { dimmed?: boolean }) {
  return (
    <div
      className={cn(
        "rounded border bg-muted/40 p-2",
        dimmed && "opacity-70 hover:opacity-100 transition-opacity",
        className,
      )}
    >
      <ResponseSummary response={response} transformUrl={transformUrl} />
    </div>
  );
}
