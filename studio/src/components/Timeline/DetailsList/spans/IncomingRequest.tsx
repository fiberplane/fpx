import type { OtelSpan } from "@/queries";
import {
  cn,
  getHttpMethodTextColor,
  getRequestEnv,
  isSensitiveEnvVar,
} from "@/utils";
import { getMatchedRoute, getRequestMethod, getRequestUrl } from "@/utils";
import { useMemo } from "react";
import { useTimelineIcon } from "../../hooks";
import { SectionHeading } from "../../shared";
import { CollapsibleKeyValueTableV2 } from "../KeyValueTableV2";

export function IncomingRequest({ span }: { span: OtelSpan }) {
  const id = span.span_id;
  const method = getRequestMethod(span);

  const pathWithSearch = useMemo<string>(() => {
    return getRequestUrl(span);
  }, [span]);

  const matchedRoute = useMemo<string>(() => {
    return getMatchedRoute(span);
  }, [span]);

  const icon = useTimelineIcon(span);
  const requestEnv = getRequestEnv(span);

  return (
    <div id={id}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <SectionHeading className="flex items-center gap-2 max-lg:mt-2">
            {icon}
            Incoming Request
          </SectionHeading>

          <div className="flex gap-2">
            <div className="inline-flex gap-2 font-mono py-1 text-xs bg-accent/80 rounded px-1">
              <span className={cn(getHttpMethodTextColor(method))}>
                {method}
              </span>
              <span className="text-gray-400 font-light">{pathWithSearch}</span>
            </div>
            {matchedRoute && (
              <div className="flex gap-2 p-1 text-xs bg-accent/80 rounded">
                <span className="text-gray-200 text-xs">Route:</span>
                <span className="text-gray-400 font-mono inline-block text-xs">
                  {matchedRoute}
                </span>
              </div>
            )}
          </div>
        </div>
        <CollapsibleKeyValueTableV2
          title="Environment Vars"
          keyValue={requestEnv}
          defaultCollapsed
          sensitiveKeys={isSensitiveEnvVar}
          emptyMessage="No environment vars found"
          keyCellClassName="w-[96px] lg:w-[96px] lg:min-w-[96px]"
        />
      </div>
    </div>
  );
}
