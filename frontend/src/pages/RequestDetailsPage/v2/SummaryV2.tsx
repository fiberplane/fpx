import { Card, CardContent } from "@/components/ui/card";

import { Status } from "@/components/ui/status";
import { OtelSpan } from "@/queries/traces-otel";
import {
  SEMATTRS_EXCEPTION_MESSAGE,
  SEMATTRS_EXCEPTION_TYPE,
} from "@opentelemetry/semantic-conventions";
import { useMemo } from "react";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { FpxCard, RequestMethod } from "../shared";
import {
  getPathWithSearch,
  getRequestMethod,
  getResponseBody,
  getStatusCode,
  getString,
} from "./otel-helpers";

export function SummaryV2({ trace }: { trace: OtelSpan }) {
  const errors = useMemo(
    () =>
      trace.events
        .filter((event) => event.name === "exception")
        .map((event) => ({
          name: getString(event.attributes[SEMATTRS_EXCEPTION_TYPE]),
          message: getString(event.attributes[SEMATTRS_EXCEPTION_MESSAGE]),
        })),
    [trace],
  );
  const hasErrors = errors.length > 0;
  const body = useMemo(() => getResponseBody(trace) ?? "", [trace]);
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

export function HttpSummary({ trace }: { trace: OtelSpan }) {
  const statusCode = useMemo(() => getStatusCode(trace), [trace]);
  const path = useMemo(() => getPathWithSearch(trace), [trace]);
  const method = useMemo(() => getRequestMethod(trace), [trace]);

  return (
    <div className="flex gap-2 items-center">
      {statusCode !== undefined && (
        <Status className="md:text-base" statusCode={statusCode} />
      )}
      <RequestMethod method={method} />
      <p className="text-sm md:text-base font-mono">{path}</p>
    </div>
  );
}
