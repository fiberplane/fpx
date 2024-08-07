import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Status } from "@/components/ui/status";
import { MizuTraceV2, isMizuRootRequestSpan } from "@/queries";
import { isMizuErrorMessage, isMizuFetchErrorMessage } from "@/queries/types";
import { useMemo } from "react";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { FpxCard, RequestMethod } from "../shared";
import {
  getMethod,
  getPathWithSearch,
  getRequestHeaders,
  getResponseBody,
  getStatusCode,
} from "./otel-helpers";
import { BadgeProps } from "@/components/ui/badge/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SummaryV2({ trace }: { trace: MizuTraceV2 }) {
  const errors = useMemo(() => selectErrors(trace), [trace]);
  const hasErrors = errors.length > 0;
  const body = useMemo(() => selectResponseBody(trace), [trace]);

  return (
    <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
      <FpxCard className="bg-muted/20">
        <CardContent className="grid gap-4 grid-rows-[auto_1fr] p-4">
          <div className="md:hidden">
            <HttpSummary trace={trace} />
          </div>
          <div className="grid gap-2 overflow-x-auto">
            <h4 className="uppercase text-xs text-muted-foreground">
              {hasErrors ? "ERRORS" : "RESPONSE"}
            </h4>
            {hasErrors ? (
              errors.map((error, idx) => (
                <a
                  className="block"
                  href={`#log-error-${error?.name}`}
                  key={idx}
                >
                  <Card
                    key={idx}
                    className="relative rounded-sm bg-secondary hover:bg-secondary/75 text-sm font-mono"
                  >
                    <CardContent className="p-2 whitespace-pre-wrap">
                      {error?.name}: {error?.message}
                    </CardContent>
                  </Card>
                </a>
              ))
            ) : (
              <FpxCard className="rounded-sm">
                <CardContent className="p-2 bg-secondary rounded-sm overflow-y-auto max-h-[200px]">
                  {body && <TextOrJsonViewer text={body} collapsed />}
                </CardContent>
              </FpxCard>
            )}
          </div>
        </CardContent>
      </FpxCard>
    </div>
  );
}

export function HttpSummary({ trace }: { trace: MizuTraceV2 }) {
  const statusCode = useMemo(() => selectStatusCode(trace), [trace]);
  const path = useMemo(() => selectPath(trace), [trace]);
  const method = useMemo(() => selectMethod(trace), [trace]);
  const isProxied = useMemo(() => selectIsProxied(trace), [trace]);

  return (
    <div className="flex gap-2 items-center">
      <Status className="md:text-base" statusCode={Number(statusCode)} />
      <RequestMethod method={method} />
      <p className="text-sm md:text-base font-mono">{path}</p>
      {isProxied && <ProxiedBadge className="rounded-xl cursor-default">Proxied</ProxiedBadge>}
    </div>
  );
}

function ProxiedBadge(props: BadgeProps) {
  return (
    <Tooltip >
      <TooltipTrigger>
        <Badge {...props}>{props.children}</Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-slate-950 text-white" align="center" side="bottom">
        This request was proxied from the webhonc service
      </TooltipContent>
    </Tooltip>
  )
}

function selectIsProxied(trace: MizuTraceV2) {
  const requestSpan = trace.spans.find(isMizuRootRequestSpan);
  if (!requestSpan) {
    console.warn("No request span found");
    return false;
  }
  const headers = getRequestHeaders(requestSpan);
  return !!headers["x-fpx-webhonc-id"];
}

function selectStatusCode(trace: MizuTraceV2) {
  for (const span of trace.spans) {
    if (isMizuRootRequestSpan(span)) {
      return getStatusCode(span);
    }
  }
  return "—";
}

function selectPath(trace: MizuTraceV2) {
  for (const span of trace.spans) {
    if (isMizuRootRequestSpan(span)) {
      return getPathWithSearch(span);
    }
  }
  return "—";
}

function selectMethod(trace: MizuTraceV2) {
  for (const span of trace.spans) {
    if (isMizuRootRequestSpan(span)) {
      return getMethod(span);
    }
  }
  return "—";
}

function selectErrors(trace: MizuTraceV2) {
  return trace?.logs
    .filter((log) => {
      return (
        isMizuErrorMessage(log.message) || isMizuFetchErrorMessage(log.message)
      );
    })
    .map((error) => {
      if (isMizuErrorMessage(error.message)) {
        return {
          name: error.message.name,
          message: error.message.message,
        };
      }

      if (isMizuFetchErrorMessage(error.message)) {
        return {
          name: error.message.statusText,
          message: error.message.body,
        };
      }
    });
}

function selectResponseBody(trace: MizuTraceV2) {
  for (const span of trace.waterfall) {
    if (isMizuRootRequestSpan(span)) {
      return getResponseBody(span);
    }
  }
  return null;
}
