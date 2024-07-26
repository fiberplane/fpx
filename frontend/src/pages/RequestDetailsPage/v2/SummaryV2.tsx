import { Card, CardContent } from "@/components/ui/card";

import { Status } from "@/components/ui/status";
// import { MizuTraceV2, isMizuRootRequestSpan } from "@/queries";
import { OtelSpan } from "@/queries/traces-otel";
// import { isMizuErrorMessage, isMizuFetchErrorMessage } from "@/queries/types";
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
  // const errors = useMemo(() => selectErrors(trace), [trace]);
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

// function selectStatusCode(trace: MizuTraceV2) {
//   for (const span of trace.spans) {
//     if (isMizuRootRequestSpan(span)) {
//       return getStatusCode(span);
//     }
//   }
//   return "—";
// }

// function selectPath(trace: MizuTraceV2) {
//   for (const span of trace.spans) {
//     if (isMizuRootRequestSpan(span)) {
//       return getPathWithSearch(span);
//     }
//   }
//   return "—";
// }

// function selectMethod(trace: MizuTraceV2) {
//   for (const span of trace.spans) {
//     if (isMizuRootRequestSpan(span)) {
//       return getRequestMethod(span);
//     }
//   }
//   return "—";
// }

// function selectErrors(trace: MizuTraceV2) {
//   return trace?.logs
//     .filter((log) => {
//       return (
//         isMizuErrorMessage(log.message) || isMizuFetchErrorMessage(log.message)
//       );
//     })
//     .map((error) => {
//       if (isMizuErrorMessage(error.message)) {
//         return {
//           name: error.message.name,
//           message: error.message.message,
//         };
//       }

//       if (isMizuFetchErrorMessage(error.message)) {
//         return {
//           name: error.message.statusText,
//           message: error.message.body,
//         };
//       }
//     });
// }

// function selectResponseBody(trace: MizuTraceV2) {
//   for (const span of trace.waterfall) {
//     if (isMizuRootRequestSpan(span)) {
//       return getResponseBody(span);
//     }
//   }
//   return null;
// }
