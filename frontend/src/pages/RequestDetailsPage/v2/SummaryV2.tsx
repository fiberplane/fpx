import { Card, CardContent } from "@/components/ui/card";

import { Status } from "@/components/ui/status";
import { MizuTraceV2, isMizuRootRequestSpan } from "@/queries";
import { isMizuErrorMessage, isMizuFetchErrorMessage } from "@/queries/types";
import { useMemo } from "react";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { FpxCard, RequestMethod } from "../shared";
import { getResponseBody } from "./otel-helpers";

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};

export function SummaryV2({ trace }: { trace: MizuTraceV2 }) {
  const errors = useMemo(() => selectErrors(trace), [trace]);
  const hasErrors = errors.length > 0;
  const body = useMemo(() => selectResponseBody(trace), [trace]);

  return (
    <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
      <FpxCard className="bg-muted/20">
        <CardContent className="grid gap-4 grid-rows-[auto_1fr] p-4">
          <div className="flex gap-2 items-center">
            <Status statusCode={Number(trace?.status)} />
            <RequestMethod method={trace?.method} />
            <p className="text-sm font-mono">{trace?.path}</p>
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
                <CardContent className="p-2 bg-secondary rounded-sm">
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
