import { Method } from "@/components/Method";
import { StatusCode } from "@/components/StatusCode";
import { cn } from "@/utils";
import type { PlaygroundActiveResponse } from "../store/types";

export function ResponseSummary({
  response,
  transformUrl = (url: string) => url,
}: {
  response?: PlaygroundActiveResponse;
  transformUrl?: (url: string) => string;
}) {
  const status = response?.responseStatusCode;
  const method = response?.requestMethod;
  const url = response?.requestUrl;

  return (
    <div className="flex items-center space-x-2 text-sm">
      <StatusCode status={status ?? "—"} isFailure={!status} />
      <div>
        <Method method={method ?? "—"} />
        <span
          className={cn(
            "font-mono",
            "whitespace-nowrap",
            "overflow-ellipsis",
            "text-xs",
            "ml-2",
            "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
          )}
        >
          {transformUrl ? transformUrl(url ?? "") : url}
        </span>
      </div>
    </div>
  );
}
