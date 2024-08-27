import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge/Badge";
import { Status } from "@/components/ui/status";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OtelSpan } from "@fiberplane/fpx-types";
import {
  SEMATTRS_EXCEPTION_MESSAGE,
  SEMATTRS_EXCEPTION_TYPE,
} from "@opentelemetry/semantic-conventions";
import { useMemo } from "react";
import { FpxCard, RequestMethod } from "../shared";
import { BodyViewerV2 } from "./BodyViewerV2";
import {
  getPathWithSearch,
  getRequestHeaders,
  getRequestMethod,
  getResponseBody,
  getStatusCode,
  getString,
} from "./otel-helpers";

export function SummaryV2({ requestSpan }: { requestSpan: OtelSpan }) {
  const errors = useMemo(
    () =>
      requestSpan.events
        ?.filter((event) => event.name === "exception")
        .map((event) => ({
          name: getString(event.attributes[SEMATTRS_EXCEPTION_TYPE]),
          message: getString(event.attributes[SEMATTRS_EXCEPTION_MESSAGE]),
        })) ?? [],
    [requestSpan],
  );
  const hasErrors = errors.length > 0;
  const body = useMemo(() => getResponseBody(requestSpan) ?? "", [requestSpan]);
  return (
    <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
      <FpxCard className="bg-muted/20">
        <CardContent className="grid gap-4 grid-rows-[auto_1fr] p-4">
          <div className="md:hidden">
            <HttpSummary trace={requestSpan} />
          </div>
          <div className="grid gap-2 overflow-x-auto">
            <h4 className="uppercase text-xs text-muted-foreground">
              {hasErrors ? "ERRORS" : "RESPONSE"}
            </h4>
            {hasErrors ? (
              errors.map((error, index) => (
                <a
                  className="block"
                  href={`#log-error-${error?.name}`}
                  key={index}
                >
                  <Card className="relative rounded-sm bg-secondary hover:bg-secondary/75 text-sm font-mono">
                    <CardContent className="p-2 whitespace-pre-wrap">
                      {error?.name}: {error?.message}
                    </CardContent>
                  </Card>
                </a>
              ))
            ) : (
              <FpxCard className="rounded-sm">
                <CardContent className="p-2 bg-secondary rounded-sm overflow-y-auto max-h-[200px]">
                  {body && <BodyViewerV2 body={body} collapsed />}
                </CardContent>
              </FpxCard>
            )}
          </div>
        </CardContent>
      </FpxCard>
    </div>
  );
}

export function HttpSummary({ trace }: { trace: OtelSpan }) {
  const statusCode = useMemo(() => getStatusCode(trace), [trace]);
  const path = useMemo(() => getPathWithSearch(trace), [trace]);
  const method = useMemo(() => getRequestMethod(trace), [trace]);
  const isProxied = useMemo(() => selectIsProxied(trace), [trace]);
  return (
    <div className="flex gap-2 items-center">
      {statusCode !== undefined && (
        <Status className="md:text-base" statusCode={statusCode} />
      )}
      <RequestMethod method={method} />
      <p className="text-sm md:text-base font-mono">{path}</p>
      {isProxied && (
        <ProxiedBadge className="rounded-xl cursor-default">
          Proxied
        </ProxiedBadge>
      )}
    </div>
  );
}

function ProxiedBadge(props: BadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge {...props}>{props.children}</Badge>
      </TooltipTrigger>
      <TooltipContent
        className="bg-slate-950 text-white"
        align="center"
        side="bottom"
      >
        This request was proxied from the FPX proxy service
      </TooltipContent>
    </Tooltip>
  );
}

function selectIsProxied(requestSpan: OtelSpan) {
  const headers = getRequestHeaders(requestSpan);
  return !!headers["x-fpx-webhonc-id"];
}
